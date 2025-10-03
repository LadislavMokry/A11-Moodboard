# Moodeight - Development Handover

**Last Updated**: October 3, 2025
**Phase Completed**: Phase 2 - Core Data Layer - Boards ✅
**Next Phase**: Phase 3 - UI Foundation & Theme System

---

## Project Overview

**Moodeight** is a moodboard web application where users collect, arrange, and share images. Built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **Deployment Target**: Cloudflare Pages

---

## What Has Been Implemented (Phase 1)

### 1.1 Supabase Client Setup & Environment Configuration ✅

**Files Created:**
- `src/lib/supabase.ts` - Singleton Supabase client with type safety
- `.env` - Environment variables (correct anon key configured)

**Key Features:**
- Type-safe Supabase client using Database types
- Auto-refresh tokens enabled
- Persistent sessions (localStorage)
- Session detection in URL for OAuth callbacks

**Environment Variables:**
```
VITE_SUPABASE_URL=https://jqjkdfbgrtdlkkfwavyq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxamtkZmJncnRkbGtrZndhdnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQzNzUsImV4cCI6MjA3NDk2MDM3NX0.xwusc7AheM9y9y7YNnZ4a3N8CQ-MWsb644ls-Em9ofI
SUPABASE_SERVICE_ROLE_KEY=[configured]
```

---

### 1.2 Authentication Context & Provider ✅

**Files Created:**
- `src/contexts/AuthContext.tsx` - Auth context with user/session state
- `src/hooks/useAuth.ts` - Hook to consume auth context
- `src/pages/AuthCallback.tsx` - OAuth callback handler

**Files Modified:**
- `src/main.tsx` - Wrapped app with `<AuthProvider>`
- `src/App.tsx` - Added `/auth/callback` route

**Key Features:**
- Reactive user and session state
- `signInWithGoogle()` method for OAuth
- `signOut()` method
- Auth state change listener (`onAuthStateChange`)
- Loading states during auth initialization
- Auto-redirect to home after OAuth callback

**Auth Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. Google redirects to Supabase `/auth/v1/callback`
4. Supabase redirects to app `/auth/callback`
5. `AuthCallback` component handles session and redirects to `/`

---

### 1.3 Google OAuth Sign-In Flow ✅

**Files Created:**
- `src/components/SignInButton.tsx` - Google sign-in button with loading/error states

**Files Modified:**
- `src/pages/Home.tsx` - Sign-in/sign-out UI with user state display

**Configuration Done:**
- **Supabase Dashboard**: Google OAuth provider enabled
- **Google Cloud Console**: OAuth 2.0 Client ID created
  - Client ID: `63311497083-f43tft7qt985far6uhjcsh0vdmnhnjje.apps.googleusercontent.com`
  - Authorized JavaScript origins: `http://localhost:5173`, `https://jqjkdfbgrtdlkkfwavyq.supabase.co`
  - Authorized redirect URIs: `https://jqjkdfbgrtdlkkfwavyq.supabase.co/auth/v1/callback`

**Key Features:**
- Sign-in button with loading and error states
- Shows user email when signed in
- Displays "Go to Boards" and "Sign Out" buttons when authenticated
- Graceful error handling

**Issues Resolved:**
- Fixed incorrect `VITE_SUPABASE_ANON_KEY` (was using old key from `.env.example`)
- Clock skew issue (user's system clock was off)

---

### 1.4 Profile Creation & Management Schema ✅

**Files Created:**
- `src/schemas/profile.ts` - Zod schemas for Profile, ProfileUpdate, Theme
- `src/services/profiles.ts` - Service layer (getProfile, upsertProfile, updateProfileTheme)
- `src/hooks/useProfile.ts` - TanStack Query hook to fetch profile
- `src/hooks/useUpdateProfile.ts` - Mutation hooks for profile updates

**Files Modified:**
- `src/contexts/AuthContext.tsx` - Auto-creates profile on `INITIAL_SESSION` event
- `src/pages/Home.tsx` - Displays profile data (avatar, name, theme)

**Database Schema (profiles table):**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  avatar_url text,
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- ✅ INSERT: Users can insert their own profile (`auth.uid() = id`)
- ✅ UPDATE: Users can update their own profile (`auth.uid() = id`)
- ✅ SELECT: Public read access
- ✅ DELETE: Users can delete their own profile (`auth.uid() = id`)

**Key Features:**
- Auto-create profile on first sign-in with Google name and avatar
- Profile fetched via TanStack Query with 5-minute stale time
- Profile mutations with optimistic updates
- Theme preference stored in database

**Issues Resolved:**
- Profile RLS INSERT policy was missing (created by Supabase MCP agent)
- Profile upsert hanging on `SIGNED_IN` event (fixed by only upserting on `INITIAL_SESSION`)
- Timing issue: Profile now created when page loads with existing session, not during OAuth callback

---

## Supabase Backend Configuration

### Database Tables Created:
1. **profiles** (see schema above)
2. **boards** (from bootstrap.sql, not yet used)
3. **images** (from bootstrap.sql, not yet used)
4. **board_cover_images** (from bootstrap.sql, not yet used)

### Storage Buckets Created:
1. **board-images** (10 MB limit, MIME: jpeg, png, webp, gif)
2. **avatars** (2 MB limit, MIME: jpeg, png, webp)

**Storage Policies:**
- Public read access
- Authenticated users can insert/delete from their own folders
- Path-based ownership verification

### RPCs Available (not yet used):
- `get_public_board(p_share_token uuid)`
- `get_showcase_board()`
- `reorder_images(p_board_id uuid, p_image_id uuid, p_new_index int)`
- `add_image_at_top(...)`

---

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx (pre-existing)
│   └── SignInButton.tsx (Step 1.3)
├── contexts/
│   └── AuthContext.tsx (Step 1.2)
├── hooks/
│   ├── useAuth.ts (Step 1.2)
│   ├── useProfile.ts (Step 1.4)
│   └── useUpdateProfile.ts (Step 1.4)
├── lib/
│   ├── supabase.ts (Step 1.1)
│   ├── http.ts (pre-existing, not used yet)
│   └── queryClient.ts (pre-existing)
├── pages/
│   ├── AuthCallback.tsx (Step 1.2)
│   ├── Home.tsx (modified in Step 1.3 & 1.4)
│   └── UsersPage.tsx (pre-existing demo)
├── schemas/
│   └── profile.ts (Step 1.4)
├── services/
│   └── profiles.ts (Step 1.4)
├── types/
│   └── database.ts (pre-existing, auto-generated)
├── App.tsx (modified to add /auth/callback route)
└── main.tsx (modified to wrap with AuthProvider)
```

---

## Current User Flow

1. **Landing Page** (`/`):
   - Shows "Moodeight" branding
   - **Signed Out**: "Sign in with Google" button
   - **Signed In**: User avatar, name, email, theme preference, "Go to Boards" and "Sign Out" buttons

2. **Sign-In Flow**:
   - Click "Sign in with Google" → Google OAuth → Redirect to `/auth/callback` → Redirect to `/`
   - Profile auto-created with Google name and avatar
   - Session persists in localStorage

3. **Sign-Out Flow**:
   - Click "Sign Out" → Clears session → Returns to landing page

---

## Known Issues & Workarounds

### Issue 1: Profile Upsert Hanging on SIGNED_IN Event
**Problem**: During OAuth callback, the `SIGNED_IN` event fires but profile upsert times out.
**Solution**: Only upsert profile on `INITIAL_SESSION` event (when page loads with existing session), not `SIGNED_IN`.
**Code**: `AuthContext.tsx` line 39-50

### Issue 2: Incorrect Anon Key
**Problem**: `.env` had old anon key from when project was reset.
**Solution**: Updated to correct anon key from Supabase dashboard.
**File**: `.env` line 3

### Issue 3: Missing RLS INSERT Policy
**Problem**: Users couldn't create their own profiles.
**Solution**: Added `profiles_self_insert` RLS policy via Supabase MCP agent.
**Status**: Resolved

---

## Testing the Current Implementation

### Manual Test Steps:

1. **Test Sign-In**:
   ```bash
   npm run dev
   ```
   - Go to `http://localhost:5173`
   - Click "Sign in with Google"
   - Verify redirect to Google OAuth
   - Verify redirect back to home
   - **Expected**: See avatar, name, email, theme

2. **Test Profile Display**:
   - Refresh page
   - **Expected**: Profile loads instantly (no spinner)
   - **Expected**: Avatar, name from Google metadata displayed

3. **Test Sign-Out**:
   - Click "Sign Out"
   - **Expected**: Return to "Sign in with Google" button

4. **Test Session Persistence**:
   - Sign in
   - Close browser tab
   - Reopen `http://localhost:5173`
   - **Expected**: Still signed in, profile displayed

---

## Dependencies Installed

**Core:**
- `react`, `react-dom`
- `react-router-dom` (v7)
- `@tanstack/react-query` (v5)
- `@supabase/supabase-js`
- `zod`
- `axios`

**Dev:**
- `vite`
- `typescript`
- `@types/react`, `@types/react-dom`
- `tailwindcss` (v4)
- `eslint`, `typescript-eslint`
- `vitest`, `@testing-library/react`

---

## Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Type-check and build
npm run preview       # Preview production build
npm run lint          # Run ESLint
npm test              # Run Vitest
```

---

## Phase 2 Implementation Summary ✅

### 2.1 Board Schemas & Types ✅

**Files Created:**
- `src/schemas/board.ts` - Board schema with create/update variants
- `src/schemas/boardWithImages.ts` - Composite schema for boards with images
- `src/__tests__/board.test.ts` - 27 tests covering all validation scenarios

**Key Features:**
- `boardSchema` matches `boards` table structure from bootstrap.sql
- `boardCreateSchema` omits auto-generated fields (id, owner_id, share_token, timestamps)
- `boardUpdateSchema` allows partial updates to name, description, cover_rotation_enabled
- Validation rules: name (1-60 chars), description (max 160 chars), share_token (UUID)
- TypeScript types: `Board`, `BoardCreate`, `BoardUpdate`, `BoardWithImages`

**Schema Fields:**
```typescript
{
  id: uuid,
  owner_id: uuid,
  name: string (1-60 chars),
  description?: string | null (max 160 chars),
  share_token: uuid,
  cover_rotation_enabled: boolean (default true),
  is_showcase: boolean (default false),
  created_at: string,
  updated_at: string
}
```

---

### 2.2 Image Schemas & Types ✅

**Files Created:**
- `src/schemas/image.ts` - Image schema with create/update variants
- `src/__tests__/image.test.ts` - 24 tests covering validation scenarios

**Key Features:**
- `imageSchema` matches `images` table structure from bootstrap.sql
- `imageCreateSchema` omits auto-generated fields (id, created_at)
- `imageUpdateSchema` allows updating caption only
- Validation rules: caption (max 140 chars), dimensions/size positive integers, source_url must be valid URL
- TypeScript types: `Image`, `ImageCreate`, `ImageUpdate`

**Schema Fields:**
```typescript
{
  id: uuid,
  board_id: uuid,
  storage_path: string,
  position: positive integer,
  mime_type?: string | null,
  width?: positive integer | null,
  height?: positive integer | null,
  size_bytes?: positive integer | null,
  original_filename?: string | null,
  source_url?: URL | null,
  caption?: string | null (max 140 chars),
  created_at: string
}
```

---

### 2.3 Board Service Layer ✅

**Files Created:**
- `src/lib/errors.ts` - Custom error classes
- `src/services/boards.ts` - Board CRUD operations
- `src/services/publicBoards.ts` - Public board access via RPC
- `src/__tests__/boards.service.test.ts` - 15 tests covering all service methods

**Custom Error Classes:**
```typescript
- BoardNotFoundError
- BoardOwnershipError
- ValidationError
- ImageNotFoundError
```

**Service Functions:**

1. **`getBoards(): Promise<Board[]>`**
   - Fetches all boards for authenticated user
   - Ordered by `updated_at DESC`
   - Validates with `boardSchema`

2. **`getBoard(boardId: string): Promise<BoardWithImages>`**
   - Fetches single board with images
   - Verifies ownership via auth context
   - Images sorted by position
   - Validates with `boardWithImagesSchema`

3. **`createBoard(data: BoardCreate): Promise<Board>`**
   - Creates board with current user as owner
   - Handles unique constraint violations (duplicate name)
   - Validates with `boardSchema`

4. **`updateBoard(boardId: string, updates: BoardUpdate): Promise<Board>`**
   - Updates board fields
   - Checks ownership
   - Handles unique constraints

5. **`deleteBoard(boardId: string): Promise<void>`**
   - Calls Edge Function for transactional delete
   - Verifies ownership first
   - Deletes images, storage files, and board row

6. **`regenerateShareToken(boardId: string): Promise<Board>`**
   - Generates new UUID for share_token
   - Invalidates old share links

7. **`getPublicBoard(shareToken: string): Promise<BoardWithImages>`** (publicBoards.ts)
   - Calls `get_public_board` RPC
   - No authentication required
   - Returns board with owner profile and images

---

### 2.4 Board Query Hooks ✅

**Files Created:**
- `src/hooks/useBoards.ts` - Query hook for all boards
- `src/hooks/useBoard.ts` - Query hook for single board
- `src/hooks/useBoardMutations.ts` - Mutation hooks (create, update, delete, regenerate token)
- `src/hooks/usePublicBoard.ts` - Query hook for public boards
- `src/__tests__/boardHooks.test.tsx` - 13 tests covering all hooks

**Query Hooks:**

1. **`useBoards()`**
   - Query key: `['boards', userId]`
   - Fetches all user boards
   - Enabled only when user is authenticated
   - Stale time: 2 minutes

2. **`useBoard(boardId?: string)`**
   - Query key: `['board', boardId]`
   - Fetches single board with images
   - Enabled only when boardId provided
   - Stale time: 2 minutes

3. **`usePublicBoard(shareToken?: string)`**
   - Query key: `['publicBoard', shareToken]`
   - Fetches public board (no auth)
   - Enabled only when shareToken provided
   - Stale time: 5 minutes

**Mutation Hooks:**

1. **`useCreateBoard()`**
   - Creates board
   - Invalidates `['boards']` query on success

2. **`useUpdateBoard()`**
   - Updates board
   - Optimistically updates cache
   - Invalidates `['boards']` and `['board', boardId]` on success

3. **`useDeleteBoard()`**
   - Deletes board via Edge Function
   - Removes from cache
   - Invalidates `['boards']` on success

4. **`useRegenerateShareToken()`**
   - Rotates share token
   - Optimistically updates cache
   - Invalidates queries on success

---

## Test Coverage Summary (Phase 2)

**Total Tests Written**: 79 tests
- Board schemas: 27 tests
- Image schemas: 24 tests
- Board service layer: 15 tests
- Board query hooks: 13 tests

**All tests passing** ✅

---

## Updated Project Structure

```
src/
├── __tests__/
│   ├── board.test.ts (Phase 2.1)
│   ├── image.test.ts (Phase 2.2)
│   ├── boards.service.test.ts (Phase 2.3)
│   └── boardHooks.test.tsx (Phase 2.4)
├── components/
│   ├── ErrorBoundary.tsx
│   └── SignInButton.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useUpdateProfile.ts
│   ├── useBoards.ts (Phase 2.4)
│   ├── useBoard.ts (Phase 2.4)
│   ├── useBoardMutations.ts (Phase 2.4)
│   └── usePublicBoard.ts (Phase 2.4)
├── lib/
│   ├── errors.ts (Phase 2.3)
│   ├── supabase.ts
│   ├── http.ts (pre-existing, not used yet)
│   └── queryClient.ts
├── pages/
│   ├── AuthCallback.tsx
│   ├── Home.tsx
│   └── UsersPage.tsx
├── schemas/
│   ├── profile.ts
│   ├── board.ts (Phase 2.1)
│   ├── image.ts (Phase 2.2)
│   └── boardWithImages.ts (Phase 2.1)
├── services/
│   ├── profiles.ts
│   ├── boards.ts (Phase 2.3)
│   └── publicBoards.ts (Phase 2.3)
├── types/
│   └── database.ts
├── App.tsx
└── main.tsx
```

---

## Next Steps (Phase 3: UI Foundation & Theme System)

### Step 3.1: Theme Context & System
- Create `src/contexts/ThemeContext.tsx` with system/light/dark modes
- Integrate with profile theme preference
- Add theme toggle component

### Step 3.2: Layout Components & Header
- Create main layout wrapper
- Build header with navigation and user menu
- Add responsive design

### Step 3.3: Routing Structure & Protected Routes
- Set up route guards for authenticated pages
- Add redirect logic for unauthenticated users
- Create route structure for boards, staging, public boards

---

## Important Notes for Next Session

1. **Phase 1 & 2 Complete**: Auth + data layer fully implemented with 79 tests
2. **Board CRUD Ready**: All board operations available via hooks
3. **Public Board Access Working**: Via `usePublicBoard(shareToken)` hook
4. **Custom Errors Implemented**: Typed error handling throughout service layer
5. **Test Suite Robust**: Comprehensive test coverage with Vitest + React Testing Library
6. **No UI Yet**: All work is data layer foundation, UI starts in Phase 3

---

## Deployment Reminders

### Before Deploying to Cloudflare Pages:
- [ ] Add production domain to Google OAuth authorized JavaScript origins
- [ ] Update `VITE_SHOWCASE_BOARD_ID` environment variable (optional)
- [ ] Verify all environment variables set in Cloudflare Pages settings

---

## Key Files to Reference

- **[CLAUDE.md](CLAUDE.md)** - Project architecture, patterns, conventions
- **[Spec.md](Spec.md)** - Full MVP specification
- **[PROMPT_PLAN.md](PROMPT_PLAN.md)** - Detailed step-by-step implementation guide
- **[TODO.md](TODO.md)** - High-level progress tracking (4/52 steps complete)
- **[bootstrap.sql](bootstrap.sql)** - Complete database schema with RLS and RPCs

---

## Useful Context

### Database Connection:
- **Project**: `jqjkdfbgrtdlkkfwavyq`
- **URL**: `https://jqjkdfbgrtdlkkfwavyq.supabase.co`
- **Supabase CLI**: Logged in and linked to project

### Current User Profile in DB:
- **User ID**: `51a6d515-62a3-4eae-bd45-e37f05ec48cf`
- **Email**: `ladislavmokry.sk@gmail.com`
- **Display Name**: "Laco Mokry"
- **Avatar URL**: Google profile picture
- **Theme**: "system"

---

---

**Phase 1 & 2 Complete! 🎉 Ready to build the UI foundation.**
