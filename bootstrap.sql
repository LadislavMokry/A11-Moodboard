-- Moodeight bootstrap schema (Supabase Postgres)
-- Assumes fresh database. Creates tables, constraints, RLS, triggers, and core RPCs.

-- Extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Utility: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- Utility: touch board.updated_at when related rows change
create or replace function public.touch_board_updated_at()
returns trigger language plpgsql as $$
begin
  if (tg_table_name = 'images') then
    if (tg_op = 'INSERT') then
      update public.boards set updated_at = now() where id = new.board_id;
    elsif (tg_op = 'UPDATE') then
      update public.boards set updated_at = now() where id = new.board_id;
      if new.board_id is distinct from old.board_id then
        update public.boards set updated_at = now() where id = old.board_id;
      end if;
    elsif (tg_op = 'DELETE') then
      update public.boards set updated_at = now() where id = old.board_id;
    end if;
  elsif (tg_table_name = 'board_cover_images') then
    if (tg_op = 'INSERT') then
      update public.boards set updated_at = now() where id = new.board_id;
    elsif (tg_op = 'UPDATE') then
      update public.boards set updated_at = now() where id = new.board_id;
      if new.board_id is distinct from old.board_id then
        update public.boards set updated_at = now() where id = old.board_id;
      end if;
    elsif (tg_op = 'DELETE') then
      update public.boards set updated_at = now() where id = old.board_id;
    end if;
  end if;
  return null;
end
$$;

-- Tables
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null check (char_length(name) <= 60),
  description text check (char_length(description) <= 160),
  share_token uuid not null unique default gen_random_uuid(),
  cover_rotation_enabled boolean not null default true,
  is_showcase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.images (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  storage_path text not null,
  position int not null,
  mime_type text,
  width int,
  height int,
  size_bytes bigint,
  original_filename text,
  source_url text,
  caption text check (caption is null or char_length(caption) <= 140),
  created_at timestamptz not null default now(),
  unique (board_id, position)
);
create index images_board_position_idx on public.images(board_id, position);

create table public.board_cover_images (
  board_id uuid not null references public.boards(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  position int not null,
  created_at timestamptz not null default now(),
  primary key (board_id, position),
  unique (board_id, image_id)
);

create table public.profiles (
  id uuid primary key, -- auth user id
  display_name text,
  avatar_url text,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers
create trigger set_boards_updated_at
before update on public.boards
for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger touch_boards_on_images_ins
after insert on public.images
for each row execute procedure public.touch_board_updated_at();

create trigger touch_boards_on_images_upd
after update on public.images
for each row execute procedure public.touch_board_updated_at();

create trigger touch_boards_on_images_del
after delete on public.images
for each row execute procedure public.touch_board_updated_at();

create trigger touch_boards_on_cover_ins
after insert on public.board_cover_images
for each row execute procedure public.touch_board_updated_at();

create trigger touch_boards_on_cover_upd
after update on public.board_cover_images
for each row execute procedure public.touch_board_updated_at();

create trigger touch_boards_on_cover_del
after delete on public.board_cover_images
for each row execute procedure public.touch_board_updated_at();

-- RLS
alter table public.boards enable row level security;
alter table public.images enable row level security;
alter table public.board_cover_images enable row level security;
alter table public.profiles enable row level security;

-- Policies: boards owner-only full access
create policy boards_owner_select on public.boards
for select using (auth.uid() = owner_id);

create policy boards_owner_insert on public.boards
for insert with check (auth.uid() = owner_id);

create policy boards_owner_update on public.boards
for update using (auth.uid() = owner_id);

create policy boards_owner_delete on public.boards
for delete using (auth.uid() = owner_id);

-- Policies: images via board ownership
create policy images_owner_select on public.images
for select using (
  exists (
    select 1 from public.boards b
    where b.id = images.board_id and b.owner_id = auth.uid()
  )
);

create policy images_owner_insert on public.images
for insert with check (
  exists (
    select 1 from public.boards b
    where b.id = images.board_id and b.owner_id = auth.uid()
  )
);

create policy images_owner_update on public.images
for update using (
  exists (
    select 1 from public.boards b
    where b.id = images.board_id and b.owner_id = auth.uid()
  )
);

create policy images_owner_delete on public.images
for delete using (
  exists (
    select 1 from public.boards b
    where b.id = images.board_id and b.owner_id = auth.uid()
  )
);

-- Policies: board_cover_images via board ownership
create policy cover_owner_select on public.board_cover_images
for select using (
  exists (
    select 1 from public.boards b
    where b.id = board_cover_images.board_id and b.owner_id = auth.uid()
  )
);

create policy cover_owner_insert on public.board_cover_images
for insert with check (
  exists (
    select 1 from public.boards b
    where b.id = board_cover_images.board_id and b.owner_id = auth.uid()
  )
);

create policy cover_owner_update on public.board_cover_images
for update using (
  exists (
    select 1 from public.boards b
    where b.id = board_cover_images.board_id and b.owner_id = auth.uid()
  )
);

create policy cover_owner_delete on public.board_cover_images
for delete using (
  exists (
    select 1 from public.boards b
    where b.id = board_cover_images.board_id and b.owner_id = auth.uid()
  )
);

-- Policies: profiles (public read; self insert/update)
create policy profiles_public_select on public.profiles
for select using (true);

create policy profiles_self_insert on public.profiles
for insert with check (auth.uid() = id);

create policy profiles_self_update on public.profiles
for update using (auth.uid() = id);

-- RPCs
-- Return board + images by share_token as a single JSON payload
create or replace function public.get_public_board(p_share_token uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with b as (
    select id, owner_id, name, description, cover_rotation_enabled, is_showcase, created_at, updated_at
    from public.boards
    where share_token = p_share_token
    limit 1
  ), owner_profile as (
    select p.id, p.display_name, p.avatar_url
    from public.profiles p
    where p.id = (select owner_id from b)
  ), i as (
    select id, board_id, storage_path, position, mime_type, width, height, size_bytes,
           original_filename, source_url, caption, created_at
    from public.images
    where board_id = (select id from b)
    order by position asc
  )
  select jsonb_build_object(
    'board', (select to_jsonb(b.*) from b),
    'owner', (select to_jsonb(owner_profile.*) from owner_profile),
    'images', coalesce((select jsonb_agg(to_jsonb(i.*)) from i), '[]'::jsonb)
  );
$$;

-- Return showcase board (is_showcase = true) as JSON
create or replace function public.get_showcase_board()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with b as (
    select id, owner_id, name, description, share_token, cover_rotation_enabled, is_showcase, og_image_id, og_image_path, created_at, updated_at
    from public.boards
    where is_showcase = true
    order by updated_at desc
    limit 1
  ), owner_profile as (
    select p.id, p.display_name, p.avatar_url
    from public.profiles p
    where p.id = (select owner_id from b)
  ), i as (
    select id, board_id, storage_path, position, mime_type, width, height, size_bytes,
           original_filename, source_url, caption, created_at
    from public.images
    where board_id = (select id from b)
    order by position asc
  )
  select jsonb_build_object(
    'board', (select to_jsonb(b.*) from b),
    'owner', (select to_jsonb(owner_profile.*) from owner_profile),
    'images', coalesce((select jsonb_agg(to_jsonb(i.*)) from i), '[]'::jsonb)
  );
$$;

-- Reorder images within a board: move image to new_index and shift affected slice
create or replace function public.reorder_images(p_board_id uuid, p_image_id uuid, p_new_index int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_count int;
  v_old_index int;
  v_new_index int;
begin
  -- Permission: only board owner may reorder
  select owner_id into v_owner from public.boards where id = p_board_id;
  if v_owner is null then
    raise exception 'Board not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized to reorder images on this board';
  end if;

  select count(*) into v_count from public.images where board_id = p_board_id;
  if v_count = 0 then return; end if;

  select position into v_old_index from public.images where id = p_image_id and board_id = p_board_id;
  if v_old_index is null then
    raise exception 'Image not found in board';
  end if;

  v_new_index := greatest(1, least(coalesce(p_new_index, v_old_index), v_count));
  if v_new_index = v_old_index then return; end if;

  if v_new_index < v_old_index then
    -- shift down range [v_new_index, v_old_index-1] up by 1
    update public.images
    set position = position + 1
    where board_id = p_board_id
      and position >= v_new_index and position < v_old_index;
  else
    -- v_new_index > v_old_index: shift up range [v_old_index+1, v_new_index] down by 1
    update public.images
    set position = position - 1
    where board_id = p_board_id
      and position > v_old_index and position <= v_new_index;
  end if;

  update public.images set position = v_new_index where id = p_image_id;
end
$$;

-- Insert image at top (position 1) and shift others
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
  select owner_id into v_owner from public.boards where id = p_board_id;
  if v_owner is null then
    raise exception 'Board not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized to add images to this board';
  end if;

  -- Use advisory lock to prevent race conditions when multiple images are uploaded simultaneously
  perform pg_advisory_xact_lock(hashtext(p_board_id::text));

  -- Shift existing positions in DESCENDING order to avoid conflicts
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

  insert into public.images(
    board_id, storage_path, position, mime_type, width, height, size_bytes,
    original_filename, source_url, caption
  ) values (
    p_board_id, p_storage_path, 1, p_mime_type, p_width, p_height, p_size_bytes,
    p_original_filename, p_source_url, p_caption
  ) returning * into v_row;

  return v_row;
end
$$;

-- Notes:
-- - Storage bucket policies are not included here; configure via Supabase Storage policies.
-- - Edge Functions (import_from_url, delete_board, delete_images, transfer_images) are implemented in Deno separately.

