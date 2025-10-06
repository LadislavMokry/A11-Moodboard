/**
 * Supabase Edge Function: generate-og-image
 *
 * Generates a pre-optimized OG preview image (1200x630 WebP) for a board.
 * This eliminates on-demand transformation issues with WhatsApp/Facebook.
 *
 * Request body:
 * {
 *   "boardId": "uuid",
 *   "imageId": "uuid"  // The image to use for OG preview
 * }
 *
 * Response:
 * {
 *   "ogImagePath": "og-images/{boardId}.webp"
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  boardId: string;
  imageId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user from JWT
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { boardId, imageId } = body;

    if (!boardId || !imageId) {
      return new Response(
        JSON.stringify({ error: 'Missing boardId or imageId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the board
    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return new Response(
        JSON.stringify({ error: 'Board not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (board.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the source image
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('storage_path')
      .eq('id', imageId)
      .eq('board_id', boardId)
      .single();

    if (imageError || !image) {
      return new Response(
        JSON.stringify({ error: 'Image not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the transformed image from Supabase Storage
    // Request JPG format for WhatsApp compatibility (WhatsApp doesn't support WebP for OG images)
    const transformUrl = `${supabaseUrl}/storage/v1/render/image/public/board-images/${image.storage_path}?width=1200&height=630&resize=cover&quality=80&format=origin`;

    const imageResponse = await fetch(transformUrl, {
      headers: {
        'Accept': 'image/jpeg,image/jpg,image/*,*/*;q=0.8',
      },
    });

    if (!imageResponse.ok) {
      console.error('Failed to fetch transformed image:', imageResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to transform image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg';

    // Check file size (WhatsApp requires < 300KB)
    if (imageBuffer.byteLength > 300 * 1024) {
      return new Response(
        JSON.stringify({ error: `Image too large: ${Math.round(imageBuffer.byteLength / 1024)}KB (max 300KB)` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine file extension from content type
    const extension = contentType.includes('webp') ? 'webp' :
                     contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' :
                     'png';

    // Upload to og-images bucket
    const ogImagePath = `${boardId}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('og-images')
      .upload(ogImagePath, imageBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
        cacheControl: '31536000', // 1 year
      });

    if (uploadError) {
      console.error('Failed to upload OG image:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload OG image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update board with og_image_path
    const { error: updateError } = await supabaseAdmin
      .from('boards')
      .update({
        og_image_path: ogImagePath,
        og_image_id: imageId,
      })
      .eq('id', boardId);

    if (updateError) {
      console.error('Failed to update board:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update board' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        ogImagePath,
        size: Math.round(imageBuffer.byteLength / 1024),
        contentType,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
