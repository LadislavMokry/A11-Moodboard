import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Body = {
  boardId?: string;
};

type ImageRow = {
  id: string;
  storage_path: string;
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

  const { boardId } = body;

  // Validate required field
  if (!boardId) {
    return json(400, { error: "boardId is required" });
  }

  // Validate UUID format
  if (typeof boardId !== 'string' || !isValidUUID(boardId)) {
    return json(400, { error: "Invalid boardId format" });
  }

  try {
    // Query board and verify ownership
    const { data: board, error: boardErr } = await admin
      .from('boards')
      .select('id, owner_id, name')
      .eq('id', boardId)
      .single();

    if (boardErr || !board) {
      return json(404, { error: "Board not found" });
    }

    if (board.owner_id !== userId) {
      return json(403, { error: "Forbidden: You do not own this board" });
    }

    // Query all images in board to get storage paths
    const { data: images, error: imagesErr } = await admin
      .from('images')
      .select('id, storage_path')
      .eq('board_id', boardId);

    if (imagesErr) {
      console.error('Error querying images:', imagesErr);
      return json(500, { error: `Failed to query board images: ${imagesErr.message}` });
    }

    const imageRows: ImageRow[] = images || [];
    const storageErrors: string[] = [];

    // Delete all storage objects from board-images bucket
    if (imageRows.length > 0) {
      const storagePaths = imageRows.map(img => img.storage_path);

      // Delete in batches of 20 (Supabase storage API limit)
      const STORAGE_BATCH_SIZE = 20;
      for (let i = 0; i < storagePaths.length; i += STORAGE_BATCH_SIZE) {
        const batch = storagePaths.slice(i, i + STORAGE_BATCH_SIZE);
        const { error: storageError } = await admin.storage
          .from('board-images')
          .remove(batch);

        if (storageError) {
          console.error('Storage delete error for batch:', batch, storageError);
          storageErrors.push(`Failed to delete storage batch ${i / STORAGE_BATCH_SIZE + 1}: ${storageError.message}`);
          // Continue with other batches even if one fails
        }
      }
    }

    // Delete board row (cascade deletes images and board_cover_images via FK constraints)
    // This is an atomic operation handled by Postgres
    const { error: deleteError } = await admin
      .from('boards')
      .delete()
      .eq('id', boardId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return json(500, {
        error: `Failed to delete board: ${deleteError.message}`,
        storageErrors: storageErrors.length > 0 ? storageErrors : undefined
      });
    }

    // Return success (even if some storage files failed to delete)
    // Storage errors are logged for manual cleanup if needed
    return json(200, {
      success: true,
      boardId,
      deletedImages: imageRows.length,
      storageErrors: storageErrors.length > 0 ? storageErrors : undefined
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return json(500, { error: "Internal server error" });
  }
});

