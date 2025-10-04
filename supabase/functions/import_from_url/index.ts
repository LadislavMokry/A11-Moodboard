import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Constants from client-side validation
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

type Body = {
  boardId?: string;
  url?: string;
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// UUID v4 generator
function generateUUID(): string {
  return crypto.randomUUID();
}

// Validate URL format
function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Get file extension from mime type
function getExtensionFromMimeType(mimeType: string): string | null {
  return MIME_EXTENSION_MAP[mimeType] || null;
}

// Extract filename from URL
function extractFilenameFromURL(urlString: string): string {
  try {
    const url = new URL(urlString);
    const pathname = url.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment || 'imported-image';
  } catch {
    return 'imported-image';
  }
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

  const { boardId, url } = body;

  // Validate required fields
  if (!boardId || !url) {
    return json(400, { error: "boardId and url are required" });
  }

  // Validate UUID format for boardId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(boardId)) {
    return json(400, { error: "Invalid boardId format" });
  }

  // Validate URL format
  if (!isValidURL(url)) {
    return json(400, { error: "Invalid URL format" });
  }

  try {
    // Check ownership: query boards table for boardId, verify owner_id matches user
    const { data: board, error: boardErr } = await admin
      .from('boards')
      .select('id, owner_id')
      .eq('id', boardId)
      .single();

    if (boardErr || !board) {
      return json(404, { error: "Board not found" });
    }

    if (board.owner_id !== userId) {
      return json(403, { error: "Forbidden: You do not own this board" });
    }

    // Fetch HEAD request to check Content-Type and Content-Length
    let headResponse: Response;
    try {
      headResponse = await fetch(url, { method: 'HEAD' });
    } catch (error) {
      return json(400, { error: `Failed to fetch URL: ${error.message}` });
    }

    if (!headResponse.ok) {
      return json(400, { error: `URL returned status ${headResponse.status}` });
    }

    const contentType = headResponse.headers.get('Content-Type');
    const contentLength = headResponse.headers.get('Content-Length');

    // Validate mime type
    if (!contentType || !ALLOWED_IMAGE_MIME_TYPES.includes(contentType)) {
      return json(415, {
        error: "Unsupported media type. Allowed types: JPG, PNG, WebP, GIF",
        receivedType: contentType
      });
    }

    // Validate size
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return json(413, {
          error: "Image too large. Maximum size is 10MB",
          size,
          maxSize: MAX_IMAGE_SIZE_BYTES
        });
      }
    }

    // Download full image
    let imageResponse: Response;
    try {
      imageResponse = await fetch(url);
    } catch (error) {
      return json(500, { error: `Failed to download image: ${error.message}` });
    }

    if (!imageResponse.ok) {
      return json(400, { error: `Failed to download image: status ${imageResponse.status}` });
    }

    // Read as ArrayBuffer
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageSize = arrayBuffer.byteLength;

    // Double-check size after download
    if (imageSize > MAX_IMAGE_SIZE_BYTES) {
      return json(413, {
        error: "Image too large. Maximum size is 10MB",
        size: imageSize,
        maxSize: MAX_IMAGE_SIZE_BYTES
      });
    }

    // Generate UUID filename and get extension
    const uuid = generateUUID();
    const extension = getExtensionFromMimeType(contentType);
    if (!extension) {
      return json(415, { error: "Could not determine file extension from mime type" });
    }

    const filename = `${uuid}.${extension}`;
    const storagePath = `boards/${boardId}/${filename}`;

    // Upload to Storage (board-images bucket)
    const { error: uploadError } = await admin.storage
      .from('board-images')
      .upload(storagePath, arrayBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return json(500, { error: `Failed to upload image: ${uploadError.message}` });
    }

    // Extract original filename from URL
    const originalFilename = extractFilenameFromURL(url);

    // Insert image row using add_image_at_top RPC
    const { data: newImage, error: rpcError } = await admin.rpc('add_image_at_top', {
      p_board_id: boardId,
      p_storage_path: storagePath,
      p_mime_type: contentType,
      p_size_bytes: imageSize,
      p_original_filename: originalFilename,
      p_source_url: url,
    });

    if (rpcError) {
      // Clean up uploaded file if DB insert fails
      await admin.storage.from('board-images').remove([storagePath]);
      console.error('RPC error:', rpcError);
      return json(500, { error: `Failed to create image record: ${rpcError.message}` });
    }

    // Return created image object
    return json(200, { image: newImage });

  } catch (error) {
    console.error('Unexpected error:', error);
    return json(500, { error: "Internal server error" });
  }
});

