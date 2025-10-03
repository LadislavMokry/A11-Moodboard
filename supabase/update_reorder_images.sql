-- Supabase SQL script: redefine reorder_images to avoid unique constraint conflicts.
create or replace function public.reorder_images(
  p_board_id uuid,
  p_image_id uuid,
  p_new_index int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_count int;
  v_old_index int;
  v_new_index int;
  v_board_exists boolean;
begin
  select owner_id into v_owner from public.boards where id = p_board_id;
  if v_owner is null then
    raise exception 'Board not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized to reorder images on this board';
  end if;

  select count(*) into v_count from public.images where board_id = p_board_id;
  if v_count = 0 then
    return;
  end if;

  select position into v_old_index from public.images where id = p_image_id and board_id = p_board_id;
  if v_old_index is null then
    raise exception 'Image not found in board';
  end if;

  v_new_index := greatest(1, least(coalesce(p_new_index, v_old_index), v_count));
  if v_new_index = v_old_index then
    return;
  end if;

  with new_positions as (
    select
      id,
      case
        when id = p_image_id then v_new_index
        when v_new_index < v_old_index
          and position >= v_new_index
          and position < v_old_index
        then position + 1
        when v_new_index > v_old_index
          and position > v_old_index
          and position <= v_new_index
        then position - 1
        else position
      end as new_position
    from public.images
    where board_id = p_board_id
  )
  update public.images as img
  set position = np.new_position
  from new_positions as np
  where img.id = np.id;
end;
$$;
