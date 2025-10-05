-- Migration: Add og_image_id to boards table
-- This allows users to select a specific image for OG previews

-- Add og_image_id column (nullable, references images table)
ALTER TABLE public.boards
ADD COLUMN og_image_id uuid REFERENCES public.images(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.boards.og_image_id IS 'Image to use for OG preview. If null, uses first image or fallback.';

-- Update the get_public_board RPC to include og_image_id
CREATE OR REPLACE FUNCTION public.get_public_board(p_share_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH b AS (
    SELECT id, owner_id, name, description, cover_rotation_enabled, is_showcase, og_image_id, created_at, updated_at
    FROM public.boards
    WHERE share_token = p_share_token
    LIMIT 1
  ), owner_profile AS (
    SELECT p.id, p.display_name, p.avatar_url
    FROM public.profiles p
    WHERE p.id = (SELECT owner_id FROM b)
  ), i AS (
    SELECT id, board_id, storage_path, position, mime_type, width, height, size_bytes,
           original_filename, source_url, caption, created_at
    FROM public.images
    WHERE board_id = (SELECT id FROM b)
    ORDER BY position ASC
  )
  SELECT jsonb_build_object(
    'board', (SELECT to_jsonb(b.*) FROM b),
    'owner', (SELECT to_jsonb(owner_profile.*) FROM owner_profile),
    'images', COALESCE((SELECT jsonb_agg(to_jsonb(i.*)) FROM i), '[]'::jsonb)
  );
$$;
