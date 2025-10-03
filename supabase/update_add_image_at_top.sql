-- Supabase SQL script: redefine add_image_at_top to prevent position conflicts.
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
begin
  select owner_id into v_owner
  from public.boards
  where id = p_board_id;

  if v_owner is null then
    raise exception 'Board not found';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'Not authorized to add images to this board';
  end if;

  update public.images as img
  set position = ranked.new_position
  from (
    select id, position + 1 as new_position
    from public.images
    where board_id = p_board_id
    order by position desc
    for update
  ) as ranked
  where img.id = ranked.id;

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
