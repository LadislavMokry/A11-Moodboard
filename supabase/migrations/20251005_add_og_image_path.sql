-- Add og_image_path column to store pre-generated OG preview images
-- This eliminates on-demand transformation issues and ensures consistent format/size

ALTER TABLE public.boards
ADD COLUMN og_image_path text;

COMMENT ON COLUMN public.boards.og_image_path IS 'Storage path to pre-generated OG preview image (1200x630 WebP)';

-- Drop and recreate get_public_board RPC to include og_image_path
DROP FUNCTION IF EXISTS public.get_public_board(uuid);

CREATE FUNCTION public.get_public_board(p_share_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'board', json_build_object(
      'id', b.id,
      'owner_id', b.owner_id,
      'name', b.name,
      'description', b.description,
      'cover_rotation_enabled', b.cover_rotation_enabled,
      'is_showcase', b.is_showcase,
      'og_image_id', b.og_image_id,
      'og_image_path', b.og_image_path,
      'created_at', b.created_at,
      'updated_at', b.updated_at
    ),
    'owner', json_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url
    ),
    'images', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', i.id,
            'board_id', i.board_id,
            'storage_path', i.storage_path,
            'caption', i.caption,
            'position', i.position,
            'mime_type', i.mime_type,
            'width', i.width,
            'height', i.height,
            'size_bytes', i.size_bytes,
            'original_filename', i.original_filename,
            'source_url', i.source_url,
            'created_at', i.created_at
          )
          ORDER BY i.position ASC
        )
        FROM public.images i
        WHERE i.board_id = b.id
      ),
      '[]'::json
    )
  ) INTO result
  FROM public.boards b
  INNER JOIN public.profiles p ON p.id = b.owner_id
  WHERE b.share_token = p_share_token;

  RETURN result;
END;
$$;
