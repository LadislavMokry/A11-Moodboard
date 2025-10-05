# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moodeight** is a moodboard web app where users collect, arrange, and share images. Built with React + TypeScript + Vite frontend, Supabase backend (Auth, Postgres, Storage, Edge Functions), and deployed to Cloudflare Pages.

Core features: Google authentication, board creation with masonry grid layout, drag-and-drop image uploads, public board sharing via unlisted tokens, animated board covers (2×2 rotating thumbnails), and full-screen lightbox with gestures.

## Build & Development Commands

```bash
npm install           # install dependencies
npm run dev           # start Vite dev server on http://localhost:5173
npm run build         # type-check and build production assets to /dist
npm run preview       # serve /dist locally
npm run lint          # run ESLint
npm test              # run Vitest in watch mode
```

## Architecture & Key Patterns

### Frontend Structure
- **React Router 7** for client-side routing (routes: `/`, `/staging`, `/boards/:boardId`, `/b/:shareToken`, `/auth/callback`)
- **TanStack Query v5** for server state management (queries/mutations cached via `queryClient`)
- **Zod schemas** (`src/schemas/`) define runtime validation and TypeScript types for API responses
- **Service layer** (`src/services/`) wraps Axios calls and parses responses with Zod
- **Custom hooks** (`src/hooks/`) expose data via TanStack Query (e.g., `useUsers`)
- **Singleton HTTP client** (`src/lib/http.ts`) centralizes auth headers, timeouts, error mapping, and timing logs

### Backend (Supabase)
- **Postgres schema** defined in `bootstrap.sql`:
  - `boards`, `images`, `board_cover_images`, `profiles` tables with Row Level Security (RLS) enforcing owner-only access
  - Triggers auto-update `boards.updated_at` when images or covers change
  - RPCs: `get_public_board(share_token)`, `get_showcase_board()`, `reorder_images(board_id, image_id, new_index)`, `add_image_at_top(...)`
- **Supabase Edge Functions** (Deno) in `supabase/functions/`:
  - `import_from_url` – server-side fetch and upload to Storage for pasted URLs
  - `delete_board` – transactional board + images + storage deletion
  - `delete_images` – batch delete with storage cleanup
  - `transfer_images` – copy/move images between boards (duplicates or relocates storage files)
- **Storage buckets**: `board-images` (`boards/{boardId}/{uuid}.{ext}`), `avatars` (`avatars/{userId}/{uuid}.{ext}`); public read, owner-write policies

### Data Flow
1. Component calls custom hook (e.g., `useUsers`)
2. Hook uses TanStack Query to call service function
3. Service function makes Axios request via `http` client (auto-injects auth token from localStorage)
4. Response parsed with Zod schema, returned as typed data
5. Query cache invalidated on mutations to refetch stale data

### UX & Animations
- **Masonry layout** via CSS columns; single linear order (positions 1..N) persists across breakpoints
- **Drag-and-drop**: `@dnd-kit` for image reordering with long-press on touch (300ms); optimistic UI updates debounced ~150-250ms before calling `reorder_images` RPC
- **Board covers**: 2×2 grid rotating through images with staggered crossfades (~2s per tile, ~8s full cycle); pauses on hover; disable rotation on mobile if performance demands
- **Lightbox**: full-screen with keyboard arrows, zoom/pan (`@use-gesture/react`), desktop thumbnail strip with momentum scroll and macOS dock-style hover magnify; mobile swipe-to-dismiss
- **GIFs**: paused in grid/covers, animate on hover, always animate in lightbox
- **Framer Motion** for micro-animations and inertia gestures

## Environment Variables (Cloudflare Pages)

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anon public key
- `VITE_SHOWCASE_BOARD_ID` – UUID of the board displayed on marketing homepage (signed-out users)
- `VITE_API_URL` – optional base URL for http client (defaults to `/`)

All client-exposed env vars must be prefixed `VITE_`.

## Styling & UI Components

- **Tailwind 4** + **shadcn/ui** (Radix UI primitives)
- Dark monochrome UI with subtle violet accent; Inter font
- **Theme toggle**: System (default), Light, Dark; persisted in `profiles.theme` for authed users, localStorage fallback for guests
- Hover states: 2px sharp white frame (via `outline` or `box-shadow` to avoid layout shift), bottom-third caption overlay with marquee

## Testing

- **Vitest** + **React Testing Library** (`jsdom` environment)
- **MSW** for mocking HTTP requests
- Tests in `src/__tests__/` (co-located or centralized)
- Run `npm test` to watch; add `-- --coverage` for coverage report
- Write tests for hooks, services, component behavior; keep deterministic and independent

## Database Constraints & Limits

- Board name: ≤60 chars, unique per owner
- Board description: ≤160 chars
- Image caption: ≤140 chars
- Upload: max 10 MB per file; formats JPG, PNG, WebP; GIFs displayed but not transformed
- Cover pool: max 12 images in `board_cover_images`
- Batch operations: transfer/delete up to 20 images at once

## Key RPCs & Edge Functions

### RPCs (call via Supabase client)
- `get_public_board(p_share_token uuid)` → JSON with board, owner profile, and ordered images (bypasses RLS for public viewing)
- `get_showcase_board()` → JSON for homepage showcase board (`is_showcase = true`)
- `reorder_images(p_board_id uuid, p_image_id uuid, p_new_index int)` → atomically reindexes affected images
- `add_image_at_top(...)` → inserts new image at position 1, shifts others down

### Edge Functions (call via POST with JWT)
- `import_from_url` – validates ownership, fetches URL, uploads to Storage, creates image row
- `delete_board` – verifies ownership, deletes storage files and DB rows transactionally
- `delete_images` – batch delete with storage cleanup
- `transfer_images` – copy or move images between boards (duplicates or relocates storage files)

## Deployment & SSR

- **Cloudflare Pages** hosts SPA with server-side rendering for public board sharing
- **Pages Functions** provide SSR for better social media sharing:
  - `/functions/b/[shareToken].ts` – SSR handler for public board URLs (`/b/:shareToken`)
    - Fetches board data server-side via `get_public_board` RPC using service role key
    - Generates HTML with OG/Twitter meta tags for rich link previews
    - Meta tags include: board name (og:title), description, dynamic OG image URL
    - Default `noindex, nofollow` for unlisted boards
    - 24h edge cache with ETag based on `boards.updated_at` timestamp
    - Returns 304 Not Modified when ETag matches
  - `/functions/api/og/[shareToken].png.ts` – Dynamic OG image generation (Phase 12.2)
    - 1200×630 preview images with 2×2 grid from cover pool (fallback: top 4 images)
    - Board name bottom-left, "moodeight" wordmark bottom-right
    - 24h edge cache

### Local Development with Wrangler
```bash
# Copy .dev.vars.example to .dev.vars and fill in values
cp .dev.vars.example .dev.vars

# Test Pages Functions locally
npx wrangler pages dev dist --compatibility-date=2025-01-10

# Build frontend first
npm run build
```

### Environment Variables for Pages Functions
- `VITE_SUPABASE_URL` – Supabase project URL (client + server)
- `VITE_SUPABASE_ANON_KEY` – Publishable anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key (server-side only, Pages Functions)
- `VITE_SHOWCASE_BOARD_ID` – Optional showcase board UUID

## Security

- **RLS** enforces owner-only reads/writes on `boards`, `images`, `board_cover_images`
- Public boards accessed via `get_public_board(share_token)` RPC (security definer bypasses RLS safely)
- Storage buckets: public read, write/delete restricted by path ownership checks
- Edge Functions use service role key server-side; verify JWT and ownership before writes
- All auth via Supabase Auth (Google OAuth only in MVP)

## Common Workflows

### Adding a new API resource
1. Define Zod schema in `src/schemas/<resource>.ts`
2. Create service function in `src/services/<resource>.ts` that calls `http` and parses with schema
3. Expose hook in `src/hooks/use<Resource>.ts` using TanStack Query
4. Consume in page/component

### Adding a new route
1. Create page component in `src/pages/<PageName>.tsx`
2. Register in `src/App.tsx` `<Routes>` list

### Running a single test
```bash
npm test -- <test-file-path>
```

### Regenerating board share link
Rotate `share_token` column to revoke old links; all new shares use new token.

## Coding Conventions

- **TypeScript strict mode** – all code typed
- **React function components** only
- **2-space indentation**, no trailing whitespace
- **Filenames**: `PascalCase` for components/pages, `camelCase` for hooks/utils
- **Import alias**: `@/` maps to `src/` (configured in `vite.config.ts`)
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`)
- **ESLint**: `typescript-eslint`, React Hooks, React Refresh; fix issues before PRs

## CI/CD

- **GitHub Actions** workflow (`.github/workflows/ci.yml`): lint → test → build
- PRs must pass all checks before merge
- Run locally: `npm run lint && npm test && npm run build`

## Reference Files

- [Spec.md](Spec.md) – full MVP specification with UX, data model, and feature requirements
- [assignment.md](assignment.md) – original assignment brief
- [AGENTS.md](AGENTS.md) – repository structure and agent guidelines
- [bootstrap.sql](bootstrap.sql) – complete Postgres schema with RLS, triggers, and RPCs
