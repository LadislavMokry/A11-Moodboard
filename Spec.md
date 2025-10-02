# Moodeight – Mini Moodboard (MVP) Specification

## Overview
- Goal: A fast, minimal moodboard web app to collect, arrange, and share images. Smooth drag-sorting, clean dark UI, and frictionless sharing.
- Deployment: Cloudflare Pages (SPA) + Pages Functions for OG/Twitter meta and dynamic preview image. Supabase (Auth, Postgres, Storage, Edge Functions).
- Auth: Google via Supabase Auth. Public boards viewable by anyone with the link.
- Name/Brand: “moodeight”. Dark monochrome UI with subtle violet accent; Inter font.

## Tech Stack
- Frontend: Vite + React + TypeScript, React Router, Tailwind CSS, React Query.
- UI/UX libs: @dnd-kit for drag/sort, framer-motion for micro-animations/inertia, Radix UI (dialog, dropdown, hover card), @use-gesture/react for zoom/pan, react-hot-toast for toasts.
- Backend: Supabase (Auth, Postgres, Storage), Supabase Edge Functions (Deno) for server logic.
- Deployment/SSR bits: Cloudflare Pages; Pages Functions for OG meta + dynamic OG image.
- Storage: Supabase public buckets `board-images` and `avatars`.
- Env vars (Cloudflare Pages): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SHOWCASE_BOARD_ID`.

## Routes
- `/` — Homepage
  - Signed out: marketing hero (left showcase; right CTA) + drag-and-drop area UX via link to `/staging`.
  - Signed in: dashboard (list of user boards as folder cards with 2×2 rotating covers). If user has 0 boards, redirect to `/staging`.
- `/staging` — Anonymous staging area for dropped images (local-only previews, max 5; sign-in required to save).
- `/boards/:boardId` — Owner view/edit (upload, reorder, captions, manage).
- `/b/:shareToken` — Public read-only board view (lightbox, captions on hover/click, download/copy). `noindex` by default.
- `/auth/callback` — Supabase OAuth callback.

## Authentication & Profiles
- Google-only sign-in via Supabase Auth.
- `profiles` table: user can edit `display_name`, `avatar_url`, and `theme` (`system|light|dark`).
- Avatar uploads auto center-cropped to square (512×512) server-side or via client transform; no crop UI in MVP.
- Theme toggle: header control. Persist in `profiles.theme` for authed users; localStorage fallback for guests. Options: System (default), Light, Dark.

## Homepage (Signed Out)
- Hero copy (Option A):
  - Headline: “Capture your vibe.”
  - Subtext: “Drop images and arrange them into living moodboards. Share instantly with a single link.”
  - CTA: “Create a board” → navigates to `/staging`.
- Left-side showcase: a single masonry-style board pulled from a configured showcase board.
  - Config: `VITE_SHOWCASE_BOARD_ID` + DB flag `boards.is_showcase = true`.
  - Animation: 3 masonry columns, alternating vertical drift ±24px; 8s cycle per column, 1s stagger; pause on hover; disabled on mobile and for reduced-motion.

## Dashboard (Signed In)
- Shows all user boards as folder-like cards with 2×2 thumbnail covers.
- Sorting: most recently updated first. Each card shows image count and “last updated”.
- Card actions (ellipsis menu): Edit cover, Toggle rotation, Share (copy link / mobile share), Regenerate link, Rename, Delete board.
- Header (signed in): logo, “New Board”, theme toggle, avatar menu (Profile, Sign out).
- Header (signed out): logo, theme toggle (left of “Sign in with Google”), “Sign in with Google”.

## Board Covers (2×2 Rotating)
- Default: rotate through all board images.
- Custom cover pool: user can pick a larger pool (ordered), rotation uses up to 12 images.
- Rotation: staggered per-tile crossfades; ~2s per tile (≈8s to rotate all 4). Pause on hover. Disable on mobile if performance demands. Subtle scale on hover spilling slightly outside card.
- Data model: `board_cover_images(board_id, image_id, position)` cap 12; `boards.cover_rotation_enabled` boolean default true.

## Image Upload & Import
- Allowed formats: JPG, PNG, WebP; display GIFs (no transforms). Max file size: 10 MB.
- Upload UX: Drop files anywhere on board page; “Upload” button in header. Per-file progress with Cancel; up to 4 concurrent uploads.
- Paste: Support paste-from-clipboard uploads (Ctrl/Cmd+V) in board page and staging.
- Web import: Accept pasted URLs and drag-from-web via Supabase Edge Function `import_from_url` (server fetch + upload to Storage). Same validations as file upload.
- Storage layout: `board-images/boards/{boardId}/{uuid}.{ext}`; store `original_filename`.
- Thumbnails: Serve via Supabase CDN transforms (srcset at ~360/720/1080px, q=75; prefer WebP); lightbox loads original.
- New images placement: insert at position 1 via RPC `add_image_at_top` (shift others down atomically).

## Anonymous Staging Area
- If user not signed in and drops images: show previews only (no captions/reorder), max 5 images total.
- Persist across OAuth redirect using IndexedDB; on return, restore previews and open “Where to save?” modal (Create new vs Pick existing).
- After sign-in and board selection/creation, upload images.

## Boards (Owner View)
- Masonry layout using CSS columns. Single linear order persisted across breakpoints for consistent ordering.
- Drag-sorting: dnd-kit with transform-based dragging, drag overlay, custom collision for grid; long-press 300ms on touch. Optimistic reorder; persist via RPC `reorder_images(image_id, new_index)` that atomically reindexes affected slice. Debounce saves ~150–250ms.
- Hover visuals: bottom-third overlay with caption marquee; sharp-corner 2px white frame (non-shifting via outline/box-shadow) on hover.
- GIFs: paused in grid/cover; animate on hover; always animate in lightbox.
- Management actions: rename board (inline), delete image (confirm modal), delete board (type name to confirm; cascades images and storage).
- Bulk actions: selection mode (toolbar toggle), marquee select, and checkboxes on hover. Bulk delete/move/copy.
- Trash and Transfer targets: slide in at bottom-right only during drag; drag to Trash prompts confirm modal (hard delete). Drag to Transfer opens destination picker (searchable list with board thumbnails + “Create new board”); default action Copy, Move available.

## Public Board (Read-Only)
- Route `/b/:shareToken`. Anonymous access.
- UI: board name, description, owner display name + avatar. Same masonry grid style.
- Captions: bottom-third hover overlay with marquee (desktop only); captions not shown in grid on mobile.
- Lightbox: full-screen with keyboard arrows, zoom/pan (wheel/pinch/double-click), desktop thumbnail strip, download original, copy URL. Captions on the right in quotes (“…”) only; hide section if empty.
- Mobile lightbox: left/right swipe to navigate; swipe up or down closes; X button visible. Thumbnail strip is desktop-only.
- Sharing: prominent “Share” copies link; uses Web Share API on mobile; “Regenerate link” available from owner views.
- SEO: add OG/Twitter meta via Cloudflare Pages Function; default `noindex` header/meta.

## Deletion, Move, and Copy
- Deletes are hard deletes with confirmation modals (images and boards). Board delete requires typing the board name and deletes all storage objects.
- Move/Copy between boards: via Supabase Edge Function `transfer_images` (operation: copy or move; batch ≤ 20). Copy duplicates storage files; Move relocates files by copy-then-delete. Destination placement: append to end; keep caption and source_url.

## Lightbox
- Navigation: arrows (keyboard/buttons), swipe on mobile.
- Close: background click (desktop), Esc, swipe up/down, X button.
- Actions: Download (original filename), Copy URL.
- UI: right-side caption panel only; single-line caption, 140 char limit; displayed in typographic quotes; no extra metadata.
- Thumbnail strip (desktop only): draggable strip with momentum; hover magnify like macOS dock; highlights current item.

## Captions, Alt Text, Accessibility
- Captions: plain text, single-line, 140-char limit. Edited via image menu (… → Edit caption) or double-click in lightbox if owner.
- Alt text: reuse caption; if no caption, empty alt "".
- Keyboard accessible reordering: omitted for MVP.

## Public Sharing & Tokens
- All boards shareable by default. Each board has an unlisted token link (`/b/:shareToken`).
- “Share” button copies link (Web Share API on mobile). “Regenerate link” rotates `share_token` to revoke old links.
- Non-owners landing on `/boards/:boardId` are redirected to the public link.

## Database Schema
- tables
  - boards
    - id uuid PK
    - owner_id uuid (auth user id)
    - name text (≤60), unique per owner (unique (owner_id, name))
    - description text (≤160)
    - share_token uuid unique not null
    - cover_rotation_enabled boolean default true
    - is_showcase boolean default false
    - created_at timestamptz default now()
    - updated_at timestamptz default now()
  - images
    - id uuid PK
    - board_id uuid FK → boards(id) on delete cascade
    - storage_path text not null
    - position int not null (unique within board)
    - mime_type text
    - width int, height int
    - size_bytes int8
    - original_filename text
    - source_url text
    - caption text (≤140)
    - created_at timestamptz default now()
  - board_cover_images
    - board_id uuid FK → boards(id) on delete cascade
    - image_id uuid FK → images(id) on delete cascade
    - position int not null
    - created_at timestamptz default now()
    - PK (board_id, position); unique (board_id, image_id)
  - profiles
    - id uuid PK (auth user id)
    - display_name text
    - avatar_url text
    - theme text check in ('system','light','dark') default 'system'
    - created_at timestamptz default now()
    - updated_at timestamptz default now()
- indexes/constraints
  - boards: unique (owner_id, name), unique (share_token)
  - images: index (board_id, position), unique (board_id, position)
  - board_cover_images: unique (board_id, image_id)
- RLS
  - boards/images/board_cover_images: enable RLS; owner-only read/write via `boards.owner_id = auth.uid()`.
  - profiles: users can read public fields and their own row; only update own row.
  - Public read of boards/images only via RPCs.

## RPCs (Postgres SQL functions)
- `get_public_board(share_token)` — returns board and ordered images for public viewing (enforces token, no private fields).
- `get_showcase_board()` — returns the one board marked `is_showcase = true` (and images) for homepage.
- `reorder_images(board_id, image_id, new_index)` — atomically reindexes only the affected slice using integer positions; maintains unique (board_id, position).
- `add_image_at_top(board_id, storage_path, mime_type, width, height, size_bytes, original_filename, source_url, caption)` — inserts new row at position 1 and shifts others.

## Supabase Edge Functions (Deno)
- `import_from_url(board_id, url)` — requires JWT, verifies ownership, validates type/size, fetches server-side, writes to Storage, creates `images` row at end (then client can reorder or we can insert at top by calling the RPC).
- `delete_board(board_id)` — verifies ownership; deletes all storage files and DB rows transactionally.
- `delete_images(image_ids[])` — verifies ownership; deletes storage objects and rows atomically.
- `transfer_images(operation: 'copy'|'move', source_board_id, dest_board_id, image_ids[]; batch ≤ 20)` — duplicates or relocates files (copy-then-delete), creates rows in destination appended to end.

## Storage & Policies
- Buckets: `board-images` and `avatars` (public read).
- Paths
  - board-images: `boards/{boardId}/{uuid}.{ext}`
  - avatars: `avatars/{userId}/{uuid}.{ext}`
- Policies: write/delete only permitted to the owner via path-based checks (board ownership); public read allowed.

## OG/Twitter Meta & Dynamic Preview
- Cloudflare Pages Function SSRs meta tags for `/b/:shareToken` and serves a dynamic 1200×630 OG image.
- OG image style: up to 4 images from cover pool (fallback to top 4), board name bottom-left in white with subtle shadow, small “moodeight” wordmark bottom-right. If <4 images, repeat to fill.
- Caching: 24h edge cache with ETag keyed by board `updated_at` to refresh previews after changes.

## Performance & UX
- Use CDN thumbnails with srcset; lazy-load grid images; `will-change: transform` for drag.
- Optimistic UI for reorder/add/delete; revert on error. Debounce reorder save.
- Pause rotating covers when offscreen.
- Masonry via CSS columns for simplicity and perf; single linear order.

## Security
- Strict RLS enforcing owner access for private data.
- Public viewing only through `get_public_board(share_token)`.
- Storage public-read but write/delete restricted by path and ownership.
- Supabase Edge Functions use service role key server-side; verify JWT and ownership before writes.

## Limits & Support
- Upload constraints: ≤10 MB per image; drag batch any size (UI uploads 4 concurrently). Staging: up to 5 images before login.
- Usage caps: none for MVP beyond above constraints.
- Supported browsers: latest Chrome, Safari, Firefox, Edge; iOS Safari; Android Chrome.

## Open Questions (none for MVP)
- N/A — all MVP decisions locked.

## Delivery Checklist
- Supabase: schema, RLS policies, RPCs, Edge Functions deployed.
- Cloudflare Pages: env vars set; Pages Functions for OG meta + dynamic OG image.
- Frontend
  - Auth + profiles (edit display name, avatar, theme).
  - Homepage: hero + showcase; CTA → `/staging`.
  - Dashboard: board cards with rotating covers; actions menu.
  - Board page: uploads (drop anywhere, paste); grid (masonry), drag-sort; captions; bulk actions; trash/transfer targets.
  - Public board: read-only grid; lightbox with gestures and desktop thumbnail strip.
  - Share: copy link / Web Share API; regenerate link.

