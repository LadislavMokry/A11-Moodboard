/**
 * Cloudflare Pages Function for OG image proxy
 * Serves the designated OG image for a board's social media preview
 * URL: /api/og/:shareToken.png
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface PublicBoardData {
  board: {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    cover_rotation_enabled: boolean;
    is_showcase: boolean;
    og_image_id: string | null;
    created_at: string;
    updated_at: string;
  };
  owner: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  images: Array<{
    id: string;
    board_id: string;
    storage_path: string;
    caption: string | null;
    position: number;
    mime_type: string | null;
    width: number | null;
    height: number | null;
    size_bytes: number | null;
    original_filename: string | null;
    source_url: string | null;
    created_at: string;
  }>;
}

/**
 * Generate ETag from board updated_at timestamp
 */
function generateETag(updatedAt: string): string {
  const timestamp = new Date(updatedAt).getTime();
  return `"og-${timestamp}"`;
}

/**
 * Get the Supabase public URL for an image with transformation
 * Uses Supabase's built-in image transformation to resize and optimize
 */
function getImagePublicUrl(supabaseUrl: string, storagePath: string): string {
  // Use Supabase render endpoint for image transformation
  // WhatsApp requires: under 300KB, JPG or PNG only (no WebP!)
  // Facebook requires: JPG, PNG, or GIF only
  // Note: storagePath already includes "boards/" prefix, so we use it directly
  return `${supabaseUrl}/storage/v1/render/image/public/board-images/${storagePath}?width=1200&height=630&resize=cover&quality=50&format=origin`;
}

/**
 * Cloudflare Pages Function handler for OG images
 */
export async function onRequest(context: {
  request: Request;
  params: { shareToken: string };
  env: Env;
}): Promise<Response> {
  const { request, params, env } = context;
  const { shareToken } = params;

  // Validate shareToken is a valid UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(shareToken)) {
    return new Response('Invalid share token', { status: 400 });
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Fetch board data via get_public_board RPC
    const { data, error } = await supabase.rpc('get_public_board', {
      p_share_token: shareToken,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return new Response('Failed to fetch board', { status: 500 });
    }

    if (!data) {
      return new Response('Board not found', { status: 404 });
    }

    const publicBoardData = data as PublicBoardData;
    const { board, images } = publicBoardData;

    // Generate ETag from board's updated_at timestamp
    const etag = generateETag(board.updated_at);

    // Check If-None-Match header for cache validation
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 }); // Not Modified
    }

    // Determine which image to use for OG preview
    let ogImage = null;

    if (board.og_image_id) {
      // Use the designated OG image if set
      ogImage = images.find((img) => img.id === board.og_image_id);
    }

    // Fallback to first image if no designated image or designated image not found
    if (!ogImage && images.length > 0) {
      ogImage = images[0];
    }

    // If no images available, return 404
    if (!ogImage) {
      return new Response('No images available for preview', { status: 404 });
    }

    // Get the public URL for the image with transformation
    const imageUrl = getImagePublicUrl(env.VITE_SUPABASE_URL, ogImage.storage_path);

    // Redirect to the Supabase image transformation URL
    // This is more efficient than proxying the image through our function
    return new Response(null, {
      status: 302,
      headers: {
        'Location': imageUrl,
        'Cache-Control': 'public, max-age=86400', // 24 hours
        ETag: etag,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
