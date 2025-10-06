-- Fix race condition in add_image_at_top function
-- This prevents "duplicate key value violates unique constraint" errors when uploading multiple images
-- Updated: Fixed position update order to prevent conflicts during the shift operation

create or replace function public.add_image_at_top(
  p_board_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_width int,
  p_height int,
  p_size_bytes bigint,
  p_original_filename text,
  p_source_url text,
  p_caption text
) returns public.images
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_row public.images;
  v_image_record record;
begin
  -- Permission: only board owner may insert
  select owner_id into v_owner
  from public.boards
  where id = p_board_id;

  if v_owner is null then
    raise exception 'Board not found';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'Not authorized to add images to this board';
  end if;

  -- Use advisory lock to prevent race conditions when multiple images are uploaded simultaneously
  perform pg_advisory_xact_lock(hashtext(p_board_id::text));

  -- Shift existing positions in DESCENDING order to avoid conflicts
  -- This is crucial: updating 1→2, 2→3 simultaneously causes conflicts
  -- But updating 3→4, 2→3, 1→2 in that order works fine
  for v_image_record in (
    select id, position
    from public.images
    where board_id = p_board_id
    order by position desc
    for update
  )
  loop
    update public.images
    set position = v_image_record.position + 1
    where id = v_image_record.id;
  end loop;

  -- Insert new image at position 1
  insert into public.images (
    board_id,
    storage_path,
    position,
    mime_type,
    width,
    height,
    size_bytes,
    original_filename,
    source_url,
    caption
  ) values (
    p_board_id,
    p_storage_path,
    1,
    p_mime_type,
    p_width,
    p_height,
    p_size_bytes,
    p_original_filename,
    p_source_url,
    p_caption
  )
  returning * into v_row;

  return v_row;
end;
$$;

