import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_BATCH_SIZE = 100;

type Body = {
  imageIds?: string[];
};

type ImageRow = {
  id: string;
  storage_path: string;
  board_id: string;
  owner_id: string;
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
    }
  });
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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

  const { imageIds } = body;

  // Validate imageIds array
  if (!imageIds || !Array.isArray(imageIds)) {
    return json(400, { error: "imageIds must be an array" });
  }

  if (imageIds.length === 0) {
    return json(400, { error: "imageIds array cannot be empty" });
  }

  if (imageIds.length > MAX_BATCH_SIZE) {
    return json(400, {
      error: `Cannot delete more than ${MAX_BATCH_SIZE} images at once`,
      received: imageIds.length,
      maxBatchSize: MAX_BATCH_SIZE
    });
  }

  // Validate all UUIDs
  for (const id of imageIds) {
    if (typeof id !== "string" || !isValidUUID(id)) {
      return json(400, { error: `Invalid UUID format: ${id}` });
    }
  }

  try {
    // Query images with imageIds, join boards to get owner_id
    // Use explicit foreign key name to disambiguate (images.board_id -> boards.id)
    const { data: images, error: queryError } = await admin.from("images").select("id, storage_path, board_id, boards!images_board_id_fkey!inner(owner_id)").in("id", imageIds);

    if (queryError) {
      console.error("Query error:", queryError);
      return json(500, { error: `Failed to query images: ${queryError.message}` });
    }

    if (!images || images.length === 0) {
      return json(404, { error: "No images found with provided IDs" });
    }

    // Flatten the joined boards data
    const imageRows: ImageRow[] = images.map((img: any) => ({
      id: img.id,
      storage_path: img.storage_path,
      board_id: img.board_id,
      owner_id: img.boards.owner_id
    }));

    // Verify user owns all images (via board ownership)
    const unauthorizedImages = imageRows.filter((img) => img.owner_id !== userId);
    if (unauthorizedImages.length > 0) {
      return json(403, {
        error: "Forbidden: You do not own all the specified images",
        unauthorizedImageIds: unauthorizedImages.map((img) => img.id)
      });
    }

    // If user requested more images than exist, that's not an error
    // We'll just delete what we found
    const foundImageIds = imageRows.map((img) => img.id);
    const notFoundIds = imageIds.filter((id) => !foundImageIds.includes(id));

    // Delete storage objects (collect errors but continue)
    const storageErrors: string[] = [];
    const storagePaths = imageRows.map((img) => img.storage_path);

    // Delete in batches (Supabase storage API may have limits)
    const STORAGE_BATCH_SIZE = 20;
    for (let i = 0; i < storagePaths.length; i += STORAGE_BATCH_SIZE) {
      const batch = storagePaths.slice(i, i + STORAGE_BATCH_SIZE);
      const { error: storageError } = await admin.storage.from("board-images").remove(batch);

      if (storageError) {
        console.error("Storage delete error for batch:", batch, storageError);
        storageErrors.push(`Failed to delete storage batch ${i / STORAGE_BATCH_SIZE + 1}: ${storageError.message}`);
        // Continue with other batches even if one fails
      }
    }

    // Delete image rows from DB (single DELETE query with IN clause)
    // This uses a transaction automatically
    const { error: deleteError } = await admin.from("images").delete().in("id", foundImageIds);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return json(500, {
        error: `Failed to delete image records: ${deleteError.message}`,
        storageErrors: storageErrors.length > 0 ? storageErrors : undefined
      });
    }

    // Return summary
    return json(200, {
      deleted: foundImageIds.length,
      errors: storageErrors.length > 0 ? storageErrors : undefined,
      notFound: notFoundIds.length > 0 ? notFoundIds : undefined
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json(500, { error: "Internal server error" });
  }
});
