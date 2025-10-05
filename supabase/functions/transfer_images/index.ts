import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_BATCH_SIZE = 20;
const CONCURRENT_UPLOAD_LIMIT = 5;

type Operation = "copy" | "move";
type Body = {
  operation?: Operation;
  sourceBoardId?: string;
  destBoardId?: string;
  imageIds?: string[];
};

type ImageRow = {
  id: string;
  board_id: string;
  storage_path: string;
  position: number;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  original_filename: string | null;
  source_url: string | null;
  caption: string | null;
};

type NewImageRow = {
  id: string;
  board_id: string;
  storage_path: string;
  position: number;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  original_filename: string | null;
  source_url: string | null;
  caption: string | null;
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", }
  });
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Generate UUID v4
function generateUUID(): string {
  return crypto.randomUUID();
}

// Get file extension from storage path
function getExtensionFromPath(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

// Concurrent upload with limit
async function uploadConcurrently<T>(
  items: T[],
  uploadFn: (item: T, index: number) => Promise<void>,
  limit: number
): Promise<void> {
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const promise = uploadFn(items[i], i);
    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json(200, {});

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Missing bearer token" });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  // Verify JWT and get user ID
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });
  const userId = userData.user.id;

  // Parse request body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { operation, sourceBoardId, destBoardId, imageIds } = body;

  // Validate operation
  if (!operation || (operation !== "copy" && operation !== "move")) {
    return json(400, { error: "operation must be 'copy' or 'move'" });
  }

  // Validate required fields
  if (!sourceBoardId || !destBoardId) {
    return json(400, { error: "sourceBoardId and destBoardId are required" });
  }

  // Validate UUIDs
  if (!isValidUUID(sourceBoardId)) {
    return json(400, { error: "Invalid sourceBoardId format" });
  }
  if (!isValidUUID(destBoardId)) {
    return json(400, { error: "Invalid destBoardId format" });
  }

  // Validate imageIds
  if (!imageIds || !Array.isArray(imageIds)) {
    return json(400, { error: "imageIds must be an array" });
  }
  if (imageIds.length === 0) {
    return json(400, { error: "imageIds array cannot be empty" });
  }
  if (imageIds.length > MAX_BATCH_SIZE) {
    return json(400, {
      error: `Cannot transfer more than ${MAX_BATCH_SIZE} images at once`,
      received: imageIds.length,
      maxBatchSize: MAX_BATCH_SIZE
    });
  }

  // Validate all image UUIDs
  for (const id of imageIds) {
    if (typeof id !== 'string' || !isValidUUID(id)) {
      return json(400, { error: `Invalid UUID format: ${id}` });
    }
  }

  const uploadedStoragePaths: string[] = [];
  const createdImageIds: string[] = [];

  try {
    // Verify user owns both boards
    const { data: boards, error: boardsErr } = await admin
      .from('boards')
      .select('id, owner_id')
      .in('id', [sourceBoardId, destBoardId]);

    if (boardsErr) {
      console.error('Boards query error:', boardsErr);
      return json(500, { error: `Failed to query boards: ${boardsErr.message}` });
    }

    if (!boards || boards.length !== 2) {
      return json(404, { error: "One or both boards not found" });
    }

    // Check ownership of both boards
    const unauthorizedBoards = boards.filter(b => b.owner_id !== userId);
    if (unauthorizedBoards.length > 0) {
      return json(403, {
        error: "Forbidden: You do not own both boards",
        unauthorizedBoardIds: unauthorizedBoards.map(b => b.id)
      });
    }

    // Query images from source board
    const { data: images, error: imagesErr } = await admin
      .from('images')
      .select('*')
      .eq('board_id', sourceBoardId)
      .in('id', imageIds);

    if (imagesErr) {
      console.error('Images query error:', imagesErr);
      return json(500, { error: `Failed to query images: ${imagesErr.message}` });
    }

    if (!images || images.length === 0) {
      return json(404, { error: "No images found with provided IDs in source board" });
    }

    const imageRows = images as ImageRow[];

    // Get max position in destination board
    const { data: maxPosData, error: maxPosErr } = await admin
      .from('images')
      .select('position')
      .eq('board_id', destBoardId)
      .order('position', { ascending: false })
      .limit(1);

    if (maxPosErr) {
      console.error('Max position query error:', maxPosErr);
      return json(500, { error: `Failed to query destination board: ${maxPosErr.message}` });
    }

    const maxPosition = maxPosData && maxPosData.length > 0 ? maxPosData[0].position : 0;

    // Prepare new image rows
    const newImageRows: NewImageRow[] = [];

    // Copy storage files and prepare DB rows
    await uploadConcurrently(
      imageRows,
      async (image, index) => {
        try {
          // Download from source
          const { data: fileData, error: downloadErr } = await admin.storage
            .from('board-images')
            .download(image.storage_path);

          if (downloadErr || !fileData) {
            throw new Error(`Failed to download ${image.storage_path}: ${downloadErr?.message || 'Unknown error'}`);
          }

          // Generate new UUID and storage path
          const newUuid = generateUUID();
          const extension = getExtensionFromPath(image.storage_path);
          const newStoragePath = `boards/${destBoardId}/${newUuid}${extension ? '.' + extension : ''}`;

          // Upload to destination
          const arrayBuffer = await fileData.arrayBuffer();
          const { error: uploadErr } = await admin.storage
            .from('board-images')
            .upload(newStoragePath, arrayBuffer, {
              contentType: image.mime_type || 'application/octet-stream',
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadErr) {
            throw new Error(`Failed to upload to ${newStoragePath}: ${uploadErr.message}`);
          }

          uploadedStoragePaths.push(newStoragePath);

          // Prepare new image row
          newImageRows.push({
            id: newUuid,
            board_id: destBoardId,
            storage_path: newStoragePath,
            position: maxPosition + index + 1,
            mime_type: image.mime_type,
            width: image.width,
            height: image.height,
            size_bytes: image.size_bytes,
            original_filename: image.original_filename,
            source_url: image.source_url,
            caption: image.caption,
          });

          createdImageIds.push(newUuid);

        } catch (error) {
          throw new Error(`Failed to copy image ${image.id}: ${error.message}`);
        }
      },
      CONCURRENT_UPLOAD_LIMIT
    );

    // Insert new image rows in single bulk INSERT
    const { data: insertedImages, error: insertErr } = await admin
      .from('images')
      .insert(newImageRows)
      .select();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      // Rollback: delete uploaded storage files
      if (uploadedStoragePaths.length > 0) {
        await admin.storage.from('board-images').remove(uploadedStoragePaths);
      }
      return json(500, { error: `Failed to create image records: ${insertErr.message}` });
    }

    // If operation is 'move', delete originals
    if (operation === 'move') {
      const originalPaths = imageRows.map(img => img.storage_path);

      // Delete original image rows from DB
      const { error: deleteErr } = await admin
        .from('images')
        .delete()
        .in('id', imageIds);

      if (deleteErr) {
        console.error('Delete error:', deleteErr);
        // Don't fail the operation, but log the error
        // The copy was successful, deletion is a cleanup step
        console.error('Warning: Failed to delete original images from DB:', deleteErr);
      }

      // Delete original storage files
      const { error: storageDeleteErr } = await admin.storage
        .from('board-images')
        .remove(originalPaths);

      if (storageDeleteErr) {
        console.error('Storage delete error:', storageDeleteErr);
        // Don't fail the operation, log for manual cleanup
        console.error('Warning: Failed to delete original storage files:', storageDeleteErr);
      }
    }

    // Return created images
    return json(200, {
      operation,
      transferred: insertedImages?.length || createdImageIds.length,
      images: insertedImages || []
    });

  } catch (error) {
    console.error('Unexpected error:', error);

    // Rollback: clean up any uploaded storage files
    if (uploadedStoragePaths.length > 0) {
      try {
        await admin.storage.from('board-images').remove(uploadedStoragePaths);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
    }

    return json(500, { error: error.message || "Internal server error" });
  }
});

