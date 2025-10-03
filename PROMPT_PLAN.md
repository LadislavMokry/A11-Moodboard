# Moodeight Development Blueprint - LLM Implementation Prompts

This document contains detailed, step-by-step prompts for building the Moodeight moodboard application. Each prompt is designed for autonomous implementation by a code-generation LLM using test-driven development.

## Overview

**Project**: Moodeight - A fast, minimal moodboard web app for collecting, arranging, and sharing images.

**Tech Stack**: React 18, TypeScript, Vite 7, TanStack Query v5, React Router 7, Tailwind 4, Supabase (Auth, Postgres, Storage, Edge Functions), Cloudflare Pages.

**Development Approach**: Test-driven, incremental, strongly typed, with comprehensive error handling and accessibility.

---

## Phase 1: Foundation & Authentication

### Step 1.1: Supabase Client Setup & Environment Configuration

```
Set up the Supabase client infrastructure for this React + TypeScript + Vite project. Create the following:

1. Install dependencies (if not already present):
   - @supabase/supabase-js
   - @supabase/auth-ui-react (for pre-built auth UI components)

2. Create `src/lib/supabase.ts` that exports:
   - A singleton Supabase client initialized with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment variables
   - Type-safe environment variable validation (throw clear error if vars missing)
   - Export type definitions for Database types (use generic `Database` type from supabase-js)

3. Create a `.env.example` file with:
   - VITE_SUPABASE_URL=your_supabase_url
   - VITE_SUPABASE_ANON_KEY=your_anon_key
   - VITE_SHOWCASE_BOARD_ID=optional_showcase_board_uuid

4. Update `src/vite-env.d.ts` to include type definitions for the environment variables

5. Write a test in `src/__tests__/supabase.test.ts` that:
   - Mocks environment variables
   - Verifies the client is created correctly
   - Tests that missing env vars throw appropriate errors

Follow the existing project patterns: use the established file structure (src/lib/), maintain TypeScript strict mode, and ensure all code is typed. Run `npm test` to verify tests pass.
```

---

### Step 1.2: Authentication Context & Provider

```
Building on the Supabase client from Step 1.1, create an authentication context and provider. Implement:

1. Create `src/contexts/AuthContext.tsx` with:
   - AuthContext that provides: `user` (User | null), `session` (Session | null), `loading` (boolean), `signOut` function
   - AuthProvider component that:
     - Initializes with supabase.auth.getSession() on mount
     - Subscribes to auth state changes via supabase.auth.onAuthStateChange()
     - Cleans up subscription on unmount
     - Handles loading states properly (loading=true until initial session check completes)

2. Create `src/hooks/useAuth.ts`:
   - Custom hook that uses AuthContext and throws error if used outside AuthProvider
   - Should return the full auth context value

3. Update `src/main.tsx`:
   - Wrap the app with AuthProvider (inside QueryClientProvider if present, outside Router)

4. Write tests in `src/__tests__/AuthContext.test.tsx`:
   - Mock Supabase auth methods
   - Test provider initialization
   - Test auth state change handling
   - Test signOut functionality
   - Test useAuth hook throws error when used outside provider

Use React best practices: proper TypeScript typing, cleanup in useEffect, error boundaries. Ensure tests pass with `npm test`.
```

---

### Step 1.3: Google OAuth Sign-In Flow

```
Implement Google OAuth authentication flow using Supabase Auth. Build on the AuthContext from Step 1.2:

1. Create `src/services/auth.ts` with:
   - `signInWithGoogle()` function that calls supabase.auth.signInWithOAuth() with provider 'google' and redirectTo pointing to /auth/callback
   - Return type should be properly typed with Supabase's AuthError handling

2. Create `src/pages/AuthCallback.tsx`:
   - Page component that handles OAuth callback
   - Uses useEffect to call supabase.auth.getSession() on mount
   - Shows loading state while processing
   - Redirects to '/' on success using useNavigate from react-router-dom
   - Shows error message if authentication fails
   - Includes proper TypeScript typing and error handling

3. Update `src/App.tsx` routes:
   - Add route for /auth/callback that renders AuthCallback page

4. Create a simple `src/components/SignInButton.tsx`:
   - Button component that calls signInWithGoogle() on click
   - Handles loading state and errors
   - Styled with Tailwind classes matching the dark monochrome theme

5. Write tests in `src/__tests__/auth.test.ts` and `src/__tests__/AuthCallback.test.tsx`:
   - Mock Supabase auth methods
   - Test signInWithGoogle initiates OAuth flow correctly
   - Test AuthCallback handles session and redirects
   - Test error scenarios

Ensure all auth flows handle errors gracefully and provide user feedback. Run tests to verify.
```

---

### Step 1.4: Profile Creation & Management Schema

```
Create the profile management system for storing user preferences. This builds on the auth system from previous steps:

1. Create `src/schemas/profile.ts`:
   - Zod schema for Profile with fields: id (string/uuid), display_name (string, optional), avatar_url (string, optional), theme (enum: 'system' | 'light' | 'dark'), created_at (string), updated_at (string)
   - Zod schema for ProfileUpdate (partial version for updates)
   - Export TypeScript types derived from schemas: Profile, ProfileUpdate

2. Create `src/services/profiles.ts`:
   - `getProfile(userId: string)` - fetches profile from profiles table, parses with Zod schema
   - `upsertProfile(profile: ProfileUpdate)` - inserts or updates profile (user id from auth context)
   - `updateProfileTheme(theme: 'system' | 'light' | 'dark')` - updates only theme field
   - All functions should use the supabase client from src/lib/supabase.ts
   - Proper error handling and Zod validation

3. Create `src/hooks/useProfile.ts`:
   - `useProfile()` hook that uses TanStack Query to fetch current user's profile
   - Query key: ['profile', userId]
   - Automatically refetches when user changes
   - Returns { profile, isLoading, error }

4. Create `src/hooks/useUpdateProfile.ts`:
   - `useUpdateProfile()` hook with TanStack Query mutation
   - Invalidates profile query on success
   - Handles optimistic updates

5. Write tests in `src/__tests__/profiles.test.ts`:
   - Mock Supabase calls
   - Test schema validation (valid and invalid data)
   - Test service functions
   - Test hooks with React Testing Library
   - Mock TanStack Query

Follow the existing patterns: schemas in src/schemas/, services in src/services/, hooks in src/hooks/. Ensure type safety throughout.
```

---

## Phase 2: Core Data Layer - Boards

### Step 2.1: Board Schemas & Types

```
Create the board data schemas and types. This is the foundation for board management:

1. Create `src/schemas/board.ts`:
   - Zod schema for Board with all fields from database:
     - id: string (uuid)
     - owner_id: string (uuid)
     - name: string (max 60 chars, min 1 char)
     - description: string (max 160 chars, optional, nullable)
     - share_token: string (uuid)
     - cover_rotation_enabled: boolean (default true)
     - is_showcase: boolean (default false)
     - created_at: string
     - updated_at: string
   - Zod schema for BoardCreate (omits id, owner_id, share_token, timestamps)
   - Zod schema for BoardUpdate (partial, allows updating name, description, cover_rotation_enabled)
   - Export TypeScript types: Board, BoardCreate, BoardUpdate

2. Create `src/schemas/boardWithImages.ts`:
   - Import Image schema (we'll create in next step, for now use z.unknown() placeholder)
   - BoardWithImages schema that extends Board and adds images array
   - Export type BoardWithImages

3. Write comprehensive tests in `src/__tests__/board.test.ts`:
   - Test valid board data passes validation
   - Test invalid data fails with appropriate errors:
     - Name too long (>60 chars)
     - Name empty
     - Description too long (>160 chars)
     - Invalid UUID formats
   - Test BoardCreate schema
   - Test BoardUpdate schema (partial fields)
   - Test edge cases (null vs undefined for optional fields)

Use Zod's built-in validators (.min(), .max(), .uuid(), etc.) and provide clear error messages. Follow TypeScript strict mode.
```

---

### Step 2.2: Image Schemas & Types

```
Create image data schemas and complete the BoardWithImages schema from 2.1:

1. Create `src/schemas/image.ts`:
   - Zod schema for Image with all database fields:
     - id: string (uuid)
     - board_id: string (uuid)
     - storage_path: string (non-empty)
     - position: number (positive integer)
     - mime_type: string (optional, should match image/* pattern)
     - width: number (positive integer, optional)
     - height: number (positive integer, optional)
     - size_bytes: number (positive, optional)
     - original_filename: string (optional)
     - source_url: string (valid URL, optional)
     - caption: string (max 140 chars, optional, nullable)
     - created_at: string
   - Zod schema for ImageCreate (omits id, created_at)
   - Zod schema for ImageUpdate (partial, allows updating position, caption, storage_path)
   - Export types: Image, ImageCreate, ImageUpdate

2. Update `src/schemas/boardWithImages.ts`:
   - Replace z.unknown() placeholder with actual Image schema
   - Ensure images array is properly typed

3. Create validation helpers in `src/lib/imageValidation.ts`:
   - `isValidImageType(mimeType: string)` - checks if mime type is JPG, PNG, WebP, or GIF
   - `isValidImageSize(bytes: number)` - checks if under 10MB limit
   - `MAX_IMAGE_SIZE` constant (10 * 1024 * 1024)
   - `ALLOWED_IMAGE_TYPES` array

4. Write tests in `src/__tests__/image.test.ts`:
   - Test valid image data
   - Test invalid data (caption too long, negative dimensions, invalid URLs)
   - Test image validation helpers
   - Test that images array in BoardWithImages works correctly

Ensure all validators provide clear, user-friendly error messages for form validation later.
```

---

### Step 2.3: Board Service Layer

```
Create service functions for board operations. This builds on schemas from 2.1 and 2.2:

1. Create `src/services/boards.ts`:
   - `getBoards()` - fetches all boards for current user, ordered by updated_at DESC, returns Board[]
   - `getBoard(boardId: string)` - fetches single board with images, returns BoardWithImages
   - `createBoard(data: BoardCreate)` - creates new board, owner_id from auth context
   - `updateBoard(boardId: string, data: BoardUpdate)` - updates board fields
   - `deleteBoard(boardId: string)` - deletes board (calls delete_board Edge Function)
   - `regenerateShareToken(boardId: string)` - generates new share_token UUID
   - All functions should:
     - Use supabase client from src/lib/supabase.ts
     - Parse responses with Zod schemas
     - Throw typed errors on validation failure
     - Handle Supabase errors gracefully

2. Create `src/services/publicBoards.ts`:
   - `getPublicBoard(shareToken: string)` - calls get_public_board RPC, returns BoardWithImages
   - Parse result with boardWithImages schema
   - Handle case where board not found

3. Add error types in `src/lib/errors.ts`:
   - `BoardNotFoundError` class
   - `BoardOwnershipError` class
   - `ValidationError` class
   - All extend Error with proper name and message

4. Write tests in `src/__tests__/boards.test.ts`:
   - Mock Supabase methods
   - Test each service function
   - Test error handling (not found, validation errors, network errors)
   - Test Zod parsing catches invalid responses
   - Use MSW if mocking HTTP, otherwise mock Supabase client directly

Follow patterns from existing services/users.ts. Maintain consistent error handling across all functions.
```

---

### Step 2.4: Board Query Hooks with TanStack Query

```
Create React hooks for board data fetching and mutations using TanStack Query. Builds on services from 2.3:

1. Create `src/hooks/useBoards.ts`:
   - `useBoards()` - fetches user's boards with useQuery
     - Query key: ['boards', userId]
     - Uses getBoards() service
     - Enabled only when user is authenticated
     - Returns { boards, isLoading, error, refetch }

2. Create `src/hooks/useBoard.ts`:
   - `useBoard(boardId: string | undefined)` - fetches single board with images
     - Query key: ['board', boardId]
     - Uses getBoard() service
     - Enabled only when boardId is provided
     - Returns { board, isLoading, error, refetch }

3. Create `src/hooks/useBoardMutations.ts`:
   - `useCreateBoard()` - mutation for creating board
     - Invalidates ['boards'] query on success
     - Optimistic updates optional for now
   - `useUpdateBoard()` - mutation for updating board
     - Invalidates ['boards'] and ['board', boardId] on success
   - `useDeleteBoard()` - mutation for deleting board
     - Invalidates ['boards'] on success
     - Navigates away from board page after success
   - `useRegenerateShareToken()` - mutation for rotating share token
     - Invalidates ['board', boardId] on success

4. Create `src/hooks/usePublicBoard.ts`:
   - `usePublicBoard(shareToken: string | undefined)` - fetches public board by share token
     - Query key: ['publicBoard', shareToken]
     - Uses getPublicBoard() service
     - Does not require authentication
     - Returns { board, isLoading, error }

5. Write tests in `src/__tests__/boardHooks.test.tsx`:
   - Test each hook with React Testing Library
   - Mock TanStack Query QueryClient
   - Test loading, success, and error states
   - Test query invalidation on mutations
   - Test that hooks handle auth state correctly

Use the existing queryClient from src/lib/queryClient.ts. Follow patterns from useUsers.ts.
```

---

## Phase 3: UI Foundation & Theme System

### Step 3.1: Theme Context & System

```
Implement the theme system (system/light/dark) with persistence. This integrates with profiles from 1.4:

1. Create `src/contexts/ThemeContext.tsx`:
   - ThemeContext providing: theme ('system' | 'light' | 'dark'), effectiveTheme ('light' | 'dark'), setTheme function
   - ThemeProvider component that:
     - Reads initial theme from profile (via useProfile) if authenticated
     - Falls back to localStorage 'theme' for guests
     - Resolves 'system' to actual 'light'/'dark' using window.matchMedia('(prefers-color-scheme: dark)')
     - Listens for system theme changes when theme is 'system'
     - Applies theme to document.documentElement.classList ('light' or 'dark' class)
     - Updates profile when authenticated user changes theme
     - Updates localStorage when guest changes theme

2. Create `src/hooks/useTheme.ts`:
   - Custom hook that consumes ThemeContext
   - Throws error if used outside ThemeProvider
   - Returns { theme, effectiveTheme, setTheme }

3. Update Tailwind config if needed:
   - Ensure dark mode is configured with 'class' strategy
   - This should already be set up, verify in tailwind.config.js

4. Create `src/components/ThemeToggle.tsx`:
   - Dropdown or segmented control with three options: System, Light, Dark
   - Uses useTheme hook
   - Shows current selection
   - Styled with Tailwind matching the dark monochrome aesthetic
   - Include icons from lucide-react

5. Write tests in `src/__tests__/ThemeContext.test.tsx`:
   - Mock window.matchMedia
   - Test theme initialization (profile vs localStorage vs default)
   - Test theme changes update DOM
   - Test system theme preference listening
   - Test localStorage persistence for guests
   - Test profile update for authenticated users

Ensure smooth transitions and no flash of wrong theme on page load.
```

---

### Step 3.2: Layout Components & Header

```
Create the main layout components and header with auth state awareness. Builds on AuthContext and ThemeContext:

1. Create `src/components/Header.tsx`:
   - Responsive header component with:
     - Left side: "moodeight" logo/wordmark (link to /)
     - Right side (signed out): ThemeToggle, SignInButton
     - Right side (signed in): "New Board" button, ThemeToggle, Avatar dropdown menu
   - Avatar dropdown menu (use Radix UI DropdownMenu):
     - User display name or email
     - "Profile" menu item (link to /profile)
     - "Sign out" menu item
   - Mobile responsive: collapse to hamburger menu on small screens
   - Styled with Tailwind: dark monochrome with violet accent
   - Use Inter font (should already be configured in index.css)

2. Create `src/components/Layout.tsx`:
   - Layout wrapper component with Header and main content area
   - Accepts children prop
   - Proper semantic HTML: <header>, <main>
   - Responsive container with proper spacing

3. Create `src/components/Avatar.tsx`:
   - Displays user avatar image or fallback initials
   - Accepts src (string, optional), alt (string), size prop
   - Circular shape, properly handles missing images
   - Shows first letter of display name or email as fallback

4. Update `src/App.tsx`:
   - Wrap all routes in Layout component
   - Ensure proper route structure

5. Write tests in `src/__tests__/Header.test.tsx`:
   - Test header renders correctly when signed out
   - Test header renders correctly when signed in
   - Test avatar dropdown menu interactions
   - Test sign out functionality
   - Test responsive behavior (use @testing-library/react with viewport mocking)

Use Radix UI primitives for accessible dropdowns. Ensure keyboard navigation works properly.
```

---

### Step 3.3: Routing Structure & Protected Routes

```
Set up the complete routing structure with protected routes. Uses AuthContext from 1.2:

1. Create `src/components/ProtectedRoute.tsx`:
   - Wrapper component that checks authentication status
   - If loading, shows loading spinner
   - If not authenticated, redirects to / (homepage)
   - If authenticated, renders children
   - Accepts optional requiredAuth prop (default true)

2. Update `src/App.tsx` with all routes:
   - `/` - Home page (content varies by auth state)
   - `/staging` - Staging area (always accessible, behavior changes with auth)
   - `/boards/:boardId` - Protected: Board owner view
   - `/b/:shareToken` - Public board view (no auth required)
   - `/auth/callback` - OAuth callback (already exists from 1.3)
   - `/profile` - Protected: Profile settings page (placeholder for now)
   - 404 catch-all route

3. Create placeholder page components:
   - `src/pages/Home.tsx` - Basic structure, will implement in Phase 4
   - `src/pages/Staging.tsx` - Basic structure, will implement later
   - `src/pages/BoardPage.tsx` - Basic structure, will implement in Phase 4
   - `src/pages/PublicBoard.tsx` - Basic structure, will implement later
   - `src/pages/ProfilePage.tsx` - Basic structure
   - `src/pages/NotFound.tsx` - 404 page with link to home

4. Each placeholder page should:
   - Import and use Layout component
   - Show page title
   - Show "Coming soon" or similar message
   - Be properly typed with TypeScript

5. Write tests in `src/__tests__/routing.test.tsx`:
   - Test ProtectedRoute redirects when not authenticated
   - Test ProtectedRoute renders children when authenticated
   - Test all routes render correct components
   - Test 404 page for unknown routes
   - Use MemoryRouter for testing

Ensure proper TypeScript typing for route params (boardId, shareToken).
```

---

## Phase 4: Board Dashboard & Management

### Step 4.1: Empty States & Dashboard Shell

```
Build the board dashboard page with empty states. This uses hooks from 2.4:

1. Update `src/pages/Home.tsx` to show dashboard when signed in:
   - Use useAuth to check authentication status
   - If signed in, fetch boards with useBoards()
   - Show loading state while fetching
   - If error, show error message with retry button
   - If boards.length === 0, redirect to /staging (per spec)
   - If boards exist, show grid of board cards (placeholder cards for now)
   - Grid responsive: 1 col mobile, 2-3 cols tablet, 3-4 cols desktop

2. Create `src/components/EmptyState.tsx`:
   - Reusable empty state component
   - Props: icon (ReactNode), title (string), description (string), action (optional button)
   - Centered layout with Tailwind styling

3. Create `src/components/LoadingSpinner.tsx`:
   - Reusable loading spinner component
   - Animated with Tailwind or CSS
   - Props: size ('sm' | 'md' | 'lg'), optional message

4. Create `src/components/ErrorMessage.tsx`:
   - Reusable error display component
   - Shows error message with icon
   - Optional retry button
   - Props: error (Error | string), onRetry (optional function)

5. Write tests in `src/__tests__/Home.test.tsx`:
   - Test loading state
   - Test redirect to /staging when no boards
   - Test error state with retry
   - Test boards grid renders when data exists
   - Mock useBoards hook

Use lucide-react for icons. Ensure all loading/error states provide good UX.
```

---

### Step 4.2: Create Board Flow

```
Implement the "Create Board" flow with modal form. Uses mutations from 2.4:

1. Create `src/components/CreateBoardModal.tsx`:
   - Modal dialog component using Radix UI Dialog
   - Form with react-hook-form and Zod validation:
     - Board name (required, max 60 chars)
     - Description (optional, max 160 chars, textarea)
   - Uses @hookform/resolvers/zod with BoardCreate schema
   - Calls useCreateBoard mutation on submit
   - Shows loading state on submit button
   - Shows validation errors inline
   - Closes modal on success
   - Navigates to new board page after creation
   - Cancel button clears form and closes modal

2. Update `src/components/Header.tsx`:
   - Add "New Board" button (when signed in)
   - Opens CreateBoardModal on click
   - Use state to manage modal open/close

3. Create `src/lib/formValidation.ts`:
   - Helper functions for form validation
   - `trimmedString` - Zod transform that trims whitespace
   - Form-specific error messages

4. Add toast notifications:
   - Install react-hot-toast if not present
   - Create `src/lib/toast.ts` wrapper with default config
   - Success toast on board creation: "Board created"
   - Error toast on failure with error message

5. Write tests in `src/__tests__/CreateBoardModal.test.tsx`:
   - Test form validation (name required, max lengths)
   - Test successful board creation
   - Test error handling
   - Test cancel button clears form
   - Test modal open/close
   - Mock useCreateBoard mutation

Use Tailwind for styling. Ensure forms are accessible (proper labels, ARIA attributes).
```

---

### Step 4.3: Board Card Component with Static Thumbnails

```
Create the board card component for the dashboard. Start with static 2×2 thumbnail grid (animation added later):

1. Create `src/components/BoardCard.tsx`:
   - Card component displaying board info:
     - 2×2 thumbnail grid at top (aspect ratio 1:1)
     - Board name (truncate with ellipsis if too long)
     - Image count (e.g., "12 images")
     - Last updated relative time (use date-fns formatDistanceToNow)
   - Thumbnails:
     - Show first 4 images from board
     - Use Supabase CDN transform for thumbnails (360px width, quality 75)
     - If <4 images, show empty slots with placeholder
     - If 0 images, show empty state icon
   - Card is clickable, navigates to /boards/:boardId
   - Hover effect: subtle scale and shadow
   - Three-dot menu button (top-right overlay)
   - Styled with Tailwind: dark theme, rounded corners, subtle border

2. Create `src/lib/imageUtils.ts`:
   - `getSupabaseThumbnail(storagePath: string, width: number)` - generates Supabase CDN URL with transforms
   - `getImageSrcSet(storagePath: string)` - generates srcset string for responsive images
   - Uses VITE_SUPABASE_URL from env

3. Create `src/components/BoardCardMenu.tsx`:
   - Dropdown menu using Radix UI (shown from BoardCard three-dot button)
   - Menu items:
     - "Rename" (opens rename dialog)
     - "Share" (copies share link)
     - "Regenerate link" (with confirmation)
     - "Delete" (with confirmation)
   - Menu items trigger callbacks passed as props
   - Proper keyboard navigation

4. Update `src/pages/Home.tsx`:
   - Replace placeholder cards with actual BoardCard components
   - Pass boards from useBoards() to cards
   - Grid layout with proper spacing

5. Write tests in `src/__tests__/BoardCard.test.tsx`:
   - Test card renders with board data
   - Test thumbnails display correctly
   - Test click navigates to board page
   - Test menu opens and items work
   - Test empty state (0 images)
   - Mock navigation and menu callbacks

Use proper semantic HTML. Ensure images have alt text (use board name).
```

---

### Step 4.4: Board Management Actions (Rename, Delete)

```
Implement rename and delete actions for boards. Integrates with BoardCard from 4.3:

1. Create `src/components/RenameBoardDialog.tsx`:
   - Dialog with form for renaming board
   - Pre-fills current name
   - Validation: required, max 60 chars, must be unique per owner
   - Uses useUpdateBoard mutation
   - Shows loading state during save
   - Shows validation errors
   - Closes on success, shows success toast

2. Create `src/components/DeleteBoardDialog.tsx`:
   - Confirmation dialog for board deletion
   - User must type board name to confirm (per spec)
   - Text input with validation: must exactly match board name
   - "Delete" button disabled until name matches
   - Uses useDeleteBoard mutation
   - Shows warning message: "This will permanently delete all images and data"
   - Shows loading state during deletion
   - Closes on success, shows success toast, navigates if on board page

3. Update `src/components/BoardCard.tsx`:
   - Add state for managing which dialog is open (rename | delete | null)
   - Wire up menu items to open dialogs
   - Pass board data to dialogs

4. Create `src/hooks/useConfirm.ts` (bonus: reusable confirm hook):
   - Generic confirmation hook
   - Returns { confirm, ConfirmDialog }
   - Used by delete flows
   - Can be used elsewhere later

5. Write tests:
   - `src/__tests__/RenameBoardDialog.test.tsx`:
     - Test form pre-fills
     - Test validation
     - Test successful rename
     - Test error handling
   - `src/__tests__/DeleteBoardDialog.test.tsx`:
     - Test confirmation flow
     - Test name matching validation
     - Test successful deletion
     - Test cancel button
   - Mock mutations and navigation

Ensure all dialogs have proper focus management and escape key handling (Radix UI handles this).
```

---

## Phase 5: Board Page & Image Grid

### Step 5.1: Board Page Layout & Image Grid (Static)

```
Build the board page with masonry image grid. No drag-and-drop yet (added in 5.3):

1. Update `src/pages/BoardPage.tsx`:
   - Get boardId from route params (useParams)
   - Fetch board with useBoard(boardId)
   - Show loading state while fetching
   - Show error state if board not found
   - Render board header:
     - Breadcrumb or back button
     - Board name (editable inline - implement in next step)
     - Board description
     - Action buttons: "Upload", "Share", three-dot menu
   - Render image grid below header

2. Create `src/components/ImageGrid.tsx`:
   - Masonry grid using CSS columns
   - Accepts images array prop
   - Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop
   - Each image in a ImageGridItem component
   - CSS: column-count, column-gap, break-inside: avoid
   - Images ordered by position field (sorted by position ASC)

3. Create `src/components/ImageGridItem.tsx`:
   - Individual image display in grid
   - Renders img with:
     - srcset for responsive loading (360/720/1080px variants)
     - Lazy loading (loading="lazy")
     - Alt text from caption or empty string
     - Aspect ratio preserved
   - Bottom-third overlay on hover showing caption (if exists)
   - Caption uses marquee animation if text overflows (CSS animation)
   - 2px white outline on hover (using outline to avoid layout shift)
   - Three-dot menu button (top-right corner, visible on hover)
   - Click on image opens lightbox (implement in Phase 6)

4. Create `src/components/BoardPageHeader.tsx`:
   - Extract header to separate component
   - Props: board (Board), actions (ReactNode for buttons)
   - Shows board name, description, last updated
   - Responsive layout

5. Write tests:
   - `src/__tests__/BoardPage.test.tsx`:
     - Test loading state
     - Test error state (board not found)
     - Test renders board data and images
   - `src/__tests__/ImageGrid.test.tsx`:
     - Test grid renders images in correct order
     - Test responsive columns
     - Test empty state (no images)
   - `src/__tests__/ImageGridItem.test.tsx`:
     - Test image renders with proper attributes
     - Test hover overlay shows caption
     - Test menu button appears on hover

Use proper image optimization. Test with various image counts (0, 1, many).
```

---

### Step 5.2: Inline Board Rename & Description Edit

```
Add inline editing for board name and description on the board page:

1. Create `src/components/EditableText.tsx`:
   - Reusable inline editable text component
   - Props: value, onSave, maxLength, multiline (boolean), placeholder
   - States: viewing (shows text) and editing (shows input/textarea)
   - Click to edit (show input/textarea)
   - Save on Enter (blur for textarea) or blur
   - Cancel on Escape
   - Validation: trim whitespace, check maxLength
   - Shows character count when editing
   - Loading state during save
   - Error handling (shows error, reverts on error)

2. Update `src/components/BoardPageHeader.tsx`:
   - Use EditableText for board name:
     - maxLength: 60
     - multiline: false
     - onSave: calls useUpdateBoard
   - Use EditableText for board description:
     - maxLength: 160
     - multiline: true
     - placeholder: "Add a description..."
   - Style inline editors to match the design

3. Add keyboard shortcuts:
   - Cmd/Ctrl+E to edit name (when not already editing)
   - Handled in BoardPage or BoardPageHeader

4. Write tests in `src/__tests__/EditableText.test.tsx`:
   - Test click to edit
   - Test save on Enter/blur
   - Test cancel on Escape
   - Test validation (max length, required)
   - Test loading and error states
   - Test multiline mode
   - User interaction tests with fireEvent

Ensure proper accessibility: focus management, ARIA labels, keyboard navigation.
```

---

### Step 5.3: Image Upload Flow (File & Drag-Drop)

```
Implement image upload with file picker and drag-and-drop. Uses Supabase Storage:

1. Create `src/services/images.ts`:
   - `uploadImage(file: File, boardId: string)` - uploads to Supabase Storage, returns storage path
     - Generate UUID filename: `${boardId}/${uuid}.${ext}`
     - Upload to board-images bucket at path boards/{boardId}/{uuid}.{ext}
     - Validate file type and size before upload
     - Return storage path on success
   - `addImageToBoard(boardId: string, imageData: ImageCreate)` - calls add_image_at_top RPC
     - Inserts at position 1 (pushes others down)
     - Returns created image
   - `deleteImage(imageId: string)` - calls delete_images Edge Function

2. Create `src/hooks/useImageUpload.ts`:
   - `useImageUpload(boardId: string)` hook
   - Returns:
     - uploadImages(files: File[]) - handles batch upload
     - uploading (boolean) - true if any uploads in progress
     - progress (Record<string, number>) - upload progress per file (0-100)
     - errors (Record<string, string>) - errors per file
   - Implementation:
     - Upload up to 4 files concurrently (per spec)
     - Track progress for each file
     - Extract image dimensions using FileReader + Image
     - Call uploadImage then addImageToBoard for each
     - Invalidate board query on success
     - Handle errors per file (don't fail all on one error)

3. Create `src/components/ImageUploadButton.tsx`:
   - Button that opens file picker
   - Accepts multiple files
   - Filters to allowed types (jpg, png, webp, gif)
   - Calls useImageUpload on file selection
   - Shows upload progress (badge or tooltip)
   - Disabled during upload

4. Create `src/components/ImageDropZone.tsx`:
   - Invisible drop zone overlay for drag-and-drop
   - Covers entire board page when dragging files over window
   - Shows visible overlay with "Drop images here" message
   - Accepts files on drop
   - Filters to allowed types
   - Calls useImageUpload on drop
   - Handles dragenter, dragover, dragleave, drop events
   - Proper event.preventDefault() to allow drop

5. Update `src/pages/BoardPage.tsx`:
   - Add ImageUploadButton to header
   - Wrap page content with ImageDropZone

6. Create `src/components/UploadProgressToast.tsx`:
   - Custom toast component showing upload progress
   - Shows file names and progress bars
   - Cancel button per file
   - Auto-dismisses on completion
   - Used by useImageUpload

7. Write tests:
   - `src/__tests__/imageServices.test.ts`:
     - Mock Supabase storage upload
     - Test uploadImage function
     - Test addImageToBoard
   - `src/__tests__/useImageUpload.test.tsx`:
     - Test concurrent upload limiting (4 max)
     - Test progress tracking
     - Test error handling
     - Mock file reading and Supabase calls
   - `src/__tests__/ImageDropZone.test.tsx`:
     - Test drag-and-drop interactions
     - Test file type filtering
     - Test overlay visibility

Ensure proper file validation before upload. Show clear error messages for rejected files.
```

---

### Step 5.4: Paste-from-Clipboard Upload

```
Add paste-from-clipboard image upload support (Ctrl/Cmd+V):

1. Update `src/hooks/useImageUpload.ts`:
   - Add `handlePaste(clipboardItems: ClipboardItem[])` method
   - Extract image files from clipboard
   - Same validation and upload flow as file upload
   - Return updated hook interface including handlePaste

2. Create `src/hooks/useClipboardPaste.ts`:
   - Custom hook that listens for paste events
   - Accepts callback: onPaste(files: File[])
   - Filters clipboard items to image files only
   - Properly cleans up event listener
   - Only active when enabled prop is true

3. Update `src/pages/BoardPage.tsx`:
   - Use useClipboardPaste hook
   - Wire to useImageUpload.handlePaste
   - Show toast notification: "Image pasted, uploading..."
   - Disable paste listener when upload in progress

4. Update `src/pages/Staging.tsx` (placeholder implementation):
   - Also support paste in staging area
   - Store pasted images in local state (no upload yet)
   - Show preview of pasted images

5. Write tests:
   - `src/__tests__/useClipboardPaste.test.tsx`:
     - Test paste event listener setup
     - Test file extraction from clipboard
     - Test cleanup
   - `src/__tests__/BoardPagePaste.test.tsx`:
     - Integration test: paste event triggers upload
     - Mock clipboard API
     - Test paste disabled during upload

Ensure paste only works when page is focused. Handle edge cases (empty clipboard, non-image data).
```

---

## Phase 6: Drag-and-Drop Reordering

### Step 6.1: Install @dnd-kit & Basic Sortable Grid

```
Set up @dnd-kit for drag-and-drop image reordering. Start with basic functionality:

1. Install dependencies (if needed):
   - @dnd-kit/core
   - @dnd-kit/sortable
   - @dnd-kit/utilities

2. Create `src/components/SortableImageGrid.tsx`:
   - Replace ImageGrid with sortable version
   - Uses DndContext from @dnd-kit/core
   - Uses SortableContext with images array
   - Each image wrapped in SortableImageItem
   - On drag end, update local order optimistically
   - Call reorder mutation with debounce (250ms)
   - Revert on error

3. Create `src/components/SortableImageItem.tsx`:
   - Wraps ImageGridItem with useSortable hook
   - Applies transform and transition styles
   - Shows drag overlay (DragOverlay component)
   - Touch: long-press 300ms to start drag (per spec)
   - Proper will-change: transform for performance

4. Create `src/services/imageReorder.ts`:
   - `reorderImage(boardId: string, imageId: string, newPosition: number)` - calls reorder_images RPC
   - Handles RPC response/errors

5. Create `src/hooks/useImageReorder.ts`:
   - Mutation hook for reordering
   - Optimistic updates: immediately reorder in cache
   - Debounced server save (250ms)
   - Revert on error
   - Invalidate board query on success

6. Update `src/pages/BoardPage.tsx`:
   - Replace ImageGrid with SortableImageGrid
   - Pass board images

7. Write tests:
   - `src/__tests__/SortableImageGrid.test.tsx`:
     - Test drag-and-drop functionality
     - Test optimistic updates
     - Test debounced save
     - Test error handling (revert on error)
     - Mock @dnd-kit hooks
   - `src/__tests__/imageReorder.test.ts`:
     - Test reorder service function
     - Mock RPC call

Ensure smooth animations. Use CSS will-change for performance. Test on touch devices.
```

---

### Step 6.2: Custom Drag Overlay & Visual Polish

```
Enhance drag-and-drop with custom overlay and visual polish:

1. Create `src/components/DragOverlay.tsx`:
   - Custom drag overlay for dragged image
   - Shows slightly larger version of image (1.05x scale)
   - Adds shadow for depth
   - Rotates slightly (2-3 degrees) for tactile feel
   - Smooth animation
   - Uses DragOverlay from @dnd-kit/core

2. Update `src/components/SortableImageItem.tsx`:
   - When dragging, add opacity: 0.5 to original item
   - Add subtle border to drop target position
   - Smooth CSS transitions
   - Use transform instead of top/left for better performance

3. Add drop indicators:
   - Create `src/components/DropIndicator.tsx`
   - Visual indicator showing where item will drop
   - Line or highlight between images
   - Only shown during drag

4. Enhance touch experience:
   - Add haptic feedback on drag start (if supported)
   - Visual feedback during long-press delay
   - Larger touch targets on mobile

5. Handle edge cases:
   - Dragging first/last item
   - Dragging in grid with varying image heights
   - Rapid successive drags
   - Concurrent image uploads during drag

6. Write tests:
   - Test drag overlay renders during drag
   - Test drop indicators appear correctly
   - Test visual states (opacity, borders)
   - Test edge cases

Ensure accessibility: maintain keyboard navigation for reordering in future (note: keyboard reorder omitted for MVP per spec, but don't break basic tab navigation).
```

---

## Phase 7: Lightbox & Image Viewing

### Step 7.1: Basic Lightbox with Navigation

```
Create a full-screen lightbox for viewing images. Start with basic functionality:

1. Create `src/components/Lightbox.tsx`:
   - Full-screen overlay (fixed position, z-index high)
   - Dark background (rgba(0,0,0,0.95))
   - Current image displayed centered
   - Close button (X) in top-right
   - Keyboard navigation:
     - Escape to close
     - Arrow left/right to navigate prev/next
     - Tab trap (focus stays in lightbox)
   - Close on background click
   - Props: images (Image[]), initialIndex (number), onClose

2. Create `src/components/LightboxImage.tsx`:
   - Displays current image
   - Loads original size (not thumbnail)
   - Preserves aspect ratio
   - Max width/height to fit viewport
   - Loading state while image loads
   - Alt text from caption

3. Create `src/components/LightboxControls.tsx`:
   - Navigation arrows (prev/next)
   - Close button
   - Image counter (e.g., "3 / 12")
   - Styled to overlay on image
   - Fade out after inactivity (3 seconds)
   - Reappear on mouse move

4. Create `src/hooks/useLightbox.ts`:
   - Hook to manage lightbox state
   - Returns: isOpen, open(index), close, currentIndex, goToNext, goToPrev
   - Handles keyboard events
   - Prevents body scroll when open

5. Update `src/components/ImageGridItem.tsx`:
   - Click on image opens lightbox
   - Pass image index to lightbox

6. Update `src/pages/BoardPage.tsx`:
   - Use useLightbox hook
   - Render Lightbox component
   - Pass board images

7. Write tests:
   - `src/__tests__/Lightbox.test.tsx`:
     - Test open/close
     - Test keyboard navigation
     - Test background click closes
     - Test navigation wraps around
   - `src/__tests__/useLightbox.test.tsx`:
     - Test hook state management
     - Test keyboard event handling

Ensure proper focus management and ARIA attributes for accessibility.
```

---

### Step 7.2: Lightbox with Zoom & Pan (@use-gesture/react)

```
Add zoom and pan gestures to lightbox using @use-gesture/react:

1. Install dependencies:
   - @use-gesture/react
   - @react-spring/web (for smooth animations)

2. Update `src/components/LightboxImage.tsx`:
   - Add zoom state (scale: 1-5x)
   - Add pan state (x, y offsets)
   - Use useGesture from @use-gesture/react:
     - Wheel: zoom in/out (wheel.delta)
     - Pinch: zoom (2 fingers on touch)
     - Drag: pan when zoomed in
     - Double-click/tap: toggle zoom (1x <-> 2x)
   - Use useSpring from @react-spring/web for smooth transforms
   - Constrain pan to image bounds (don't pan past edge)
   - Reset zoom/pan on image change

3. Add zoom controls:
   - Update `src/components/LightboxControls.tsx`
   - Add zoom in (+) and zoom out (-) buttons
   - Show current zoom level (e.g., "2x")
   - Reset button (fit to screen)

4. Handle zoom edge cases:
   - Disable prev/next navigation while zoomed (or reset zoom on nav)
   - Prevent close on background click when zoomed/panned
   - Smooth transitions when resetting

5. Mobile-specific:
   - Pinch to zoom
   - Drag to pan
   - Double-tap to zoom
   - Swipe left/right to navigate (only when zoom = 1x)

6. Write tests:
   - `src/__tests__/LightboxZoom.test.tsx`:
     - Test zoom in/out
     - Test pan when zoomed
     - Test double-click zoom
     - Test zoom reset on navigation
     - Mock gesture events

Ensure smooth performance. Use transform for pan/zoom (GPU-accelerated).
```

---

### Step 7.3: Desktop Thumbnail Strip & Mobile Gestures

```
Add desktop thumbnail strip and mobile swipe gestures to lightbox:

1. Create `src/components/LightboxThumbnailStrip.tsx`:
   - Desktop only (hidden on mobile with Tailwind)
   - Horizontal strip at bottom showing all images
   - Current image highlighted
   - Click thumbnail to jump to that image
   - Strip is draggable with momentum scrolling (use @use-gesture/react)
   - Hover effect: thumbnail magnifies like macOS dock
   - Auto-scroll to keep current thumbnail visible
   - Uses thumbnail URLs (360px variants)

2. Add macOS dock-style hover magnification:
   - Create `src/components/MagnifiableThumbnail.tsx`
   - On hover, thumbnail scales up (1.5x)
   - Adjacent thumbnails scale slightly (1.2x, 1.1x)
   - Smooth spring animations
   - Use @react-spring/web

3. Update `src/components/Lightbox.tsx` for mobile:
   - Swipe gestures using @use-gesture/react:
     - Swipe left/right: navigate to next/prev image
     - Swipe up/down: close lightbox
   - Thresholds for swipe (e.g., 50px + velocity)
   - Swipe works only when zoom = 1x
   - Visual feedback during swipe (drag image with finger)

4. Add mobile close gesture:
   - Swipe down to dismiss (like iOS photo viewer)
   - Smooth animation as image follows swipe
   - Threshold: >100px or high velocity
   - Snap back if threshold not met

5. Update lightbox props:
   - Add isMobile prop (detect with window.innerWidth or userAgent)
   - Conditionally render thumbnail strip

6. Write tests:
   - `src/__tests__/LightboxThumbnailStrip.test.tsx`:
     - Test thumbnail rendering
     - Test click navigation
     - Test auto-scroll
     - Test magnification on hover
   - `src/__tests__/LightboxMobileGestures.test.tsx`:
     - Test swipe navigation
     - Test swipe-to-dismiss
     - Mock touch events

Desktop thumbnail strip should be performant with many images (virtualize if >50 images).
```

---

### Step 7.4: Lightbox Caption Panel & Actions

```
Add caption display and actions (download, copy URL) to lightbox:

1. Create `src/components/LightboxCaptionPanel.tsx`:
   - Desktop only: panel on right side
   - Mobile: overlay at bottom (or omit per spec - captions on hover in grid only)
   - Shows caption in typographic quotes ("...")
   - If no caption, hide panel
   - Add a toggle to hide and show the caption panel
   - Caption props: caption (string | null)
   - Styled to not obscure image

2. Add action buttons:
   - Create `src/components/LightboxActions.tsx`
   - Download button:
     - Downloads original image file
     - Uses original_filename from image data
     - Triggers browser download via <a> with download attribute
   - Copy URL button:
     - Copies public image URL to clipboard
     - Shows toast: "URL copied"
     - Uses Clipboard API
   - Share button (mobile only):
     - Uses Web Share API if available
     - Falls back to copy URL

3. Implement download logic:
   - Create `src/lib/download.ts`
   - `downloadImage(url: string, filename: string)` - triggers download
   - Fetch image as blob, create object URL, trigger download, revoke URL

4. Implement copy to clipboard:
   - Create `src/lib/clipboard.ts`
   - `copyToClipboard(text: string)` - uses Clipboard API
   - Fallback for older browsers (document.execCommand)

5. Update `src/components/Lightbox.tsx`:
   - Render LightboxCaptionPanel (if caption exists)
   - Render LightboxActions
   - Pass current image data

6. Write tests:
   - `src/__tests__/LightboxCaptionPanel.test.tsx`:
     - Test caption display
     - Test empty state
   - `src/__tests__/LightboxActions.test.tsx`:
     - Test download button
     - Test copy URL button
     - Mock Clipboard API
     - Mock download

Ensure actions work on mobile and desktop. Handle permissions for clipboard.
```

---

## Phase 8: Image Management & Captions

### Step 8.1: Edit Caption Flow

```
Add ability to edit image captions in grid and lightbox:

1. Create `src/components/EditCaptionDialog.tsx`:
   - Dialog with single-line text input
   - Max 140 chars with character counter
   - Pre-fills existing caption
   - Save and Cancel buttons
   - Uses useUpdateImage mutation (create this hook)

2. Create `src/hooks/useImageMutations.ts`:
   - `useUpdateImage()` mutation hook
     - Calls Supabase .update() on images table
     - Invalidates board query on success
     - Optimistic update
   - `useDeleteImage()` mutation hook (for next step)

3. Update `src/components/ImageGridItem.tsx`:
   - Add "Edit caption" to three-dot menu
   - Opens EditCaptionDialog on click

4. Update `src/components/Lightbox.tsx`:
   - Double-click on image (when owner) to edit caption
   - Or add edit button to caption panel
   - Opens EditCaptionDialog

5. Create caption editing in place (alternative to dialog):
   - Create `src/components/InlineCaptionEdit.tsx`
   - Inline text input appearing over image
   - Enter to save, Escape to cancel
   - Could replace dialog for quicker UX

6. Write tests:
   - `src/__tests__/EditCaptionDialog.test.tsx`:
     - Test form pre-fill
     - Test validation (max 140 chars)
     - Test save updates image
   - `src/__tests__/ImageCaptionEdit.test.tsx`:
     - Integration test: edit caption from grid
     - Test optimistic update

Ensure caption changes reflect immediately (optimistic UI).
```

---

### Step 8.2: Delete Image Flow

```
Implement single image deletion with confirmation:

1. Create `src/components/DeleteImageDialog.tsx`:
   - Confirmation dialog
   - Message: "Delete this image? This cannot be undone."
   - Shows image thumbnail
   - Delete and Cancel buttons
   - Uses useDeleteImage mutation from 8.1

2. Update `src/hooks/useImageMutations.ts`:
   - Enhance `useDeleteImage()`:
     - Calls delete_images Edge Function (pass array with single ID)
     - Optimistically removes from cache
     - Revert on error
     - Show success toast
     - If in lightbox, close lightbox or navigate to next image

3. Update `src/components/ImageGridItem.tsx`:
   - Add "Delete" to three-dot menu
   - Opens DeleteImageDialog on click

4. Update `src/components/Lightbox.tsx`:
   - Add delete button to actions or menu
   - Opens DeleteImageDialog
   - On delete success: close lightbox if only 1 image, else navigate to next

5. Write tests:
   - `src/__tests__/DeleteImageDialog.test.tsx`:
     - Test confirmation flow
     - Test deletion
     - Test cancel
   - `src/__tests__/ImageDelete.test.tsx`:
     - Integration test: delete from grid
     - Test optimistic update
     - Test error handling (revert)

Handle edge case: deleting last image in board (show empty state).
```

---

### Step 8.3: Bulk Selection & Bulk Delete

```
Add bulk selection mode for managing multiple images:

1. Create `src/contexts/SelectionContext.tsx`:
   - Context for selection state:
     - selectionMode (boolean) - whether bulk selection is active
     - selectedIds (Set<string>) - set of selected image IDs
     - toggleSelection(id) - add/remove from set
     - selectAll() / deselectAll()
     - enterSelectionMode() / exitSelectionMode()
   - Provider wraps BoardPage

2. Create `src/components/SelectionToolbar.tsx`:
   - Toolbar shown when selectionMode is true
   - Fixed position at top or bottom of page
   - Shows count: "3 selected"
   - Actions:
     - Delete (opens bulk delete confirmation)
     - Deselect all
     - Cancel (exit selection mode)

3. Update `src/components/ImageGridItem.tsx`:
   - When selectionMode is true:
     - Show checkbox overlay (top-left)
     - Click image toggles selection (instead of opening lightbox)
     - Show visual feedback when selected (border, overlay)
   - Checkbox also appears on hover even outside selection mode (quick-select)

4. Add "Select" button to BoardPageHeader:
   - Toggles selection mode
   - Shows "Cancel" when in selection mode

5. Create `src/components/BulkDeleteDialog.tsx`:
   - Confirmation dialog for bulk delete
   - Shows count: "Delete 5 images?"
   - Cannot be undone warning
   - Calls delete_images Edge Function with array of IDs

6. Implement marquee selection (bonus):
   - Create `src/hooks/useMarqueeSelect.ts`
   - Click-and-drag on grid background to draw selection rectangle
   - Auto-selects images within rectangle
   - Only works in selection mode

7. Write tests:
   - `src/__tests__/SelectionContext.test.tsx`:
     - Test selection state management
   - `src/__tests__/BulkSelection.test.tsx`:
     - Test entering/exiting selection mode
     - Test selecting multiple images
     - Test bulk delete

Ensure performance with many images. Use Set for O(1) selection checks.
```

---

## Phase 9: Public Board Sharing

### Step 9.1: Public Board View (Read-Only)

```
Implement the public board page accessible via share token:

1. Update `src/pages/PublicBoard.tsx`:
   - Get shareToken from route params (useParams)
   - Fetch board with usePublicBoard(shareToken) from 2.4
   - Show loading state
   - Show 404 if board not found
   - Render board content (read-only):
     - Board name and description
     - Owner display name and avatar
     - Image grid (same ImageGrid component, but read-only)
   - No edit buttons, no upload, no drag-and-drop
   - Add "noindex" meta tag (SEO)

2. Create `src/components/PublicBoardHeader.tsx`:
   - Shows board info
   - Shows owner info (avatar, name)
   - "Share" button (copies current URL)
   - No edit or manage buttons

3. Update ImageGrid to accept readOnly prop:
   - Update `src/components/ImageGrid.tsx`
   - When readOnly, don't make grid sortable
   - Images still clickable to open lightbox

4. Update Lightbox for public view:
   - Pass readOnly prop
   - Hide edit caption, delete buttons
   - Keep download and copy URL buttons

5. Add SEO meta tags:
   - Create `src/components/Meta.tsx` using react-helmet-async
   - For public boards, set:
     - og:title (board name)
     - og:description (board description)
     - og:image (placeholder for now, dynamic image in Phase 11)
     - twitter:card
     - robots: noindex, nofollow

6. Handle non-owners landing on /boards/:boardId:
   - Update `src/pages/BoardPage.tsx`
   - Check if current user owns board
   - If not, redirect to /b/:shareToken

7. Write tests:
   - `src/__tests__/PublicBoard.test.tsx`:
     - Test public board renders
     - Test read-only behavior
     - Test 404 for invalid token
     - Test meta tags
   - Test redirect from private URL to public

Ensure public boards are fully accessible without authentication.
```

---

### Step 9.2: Share Button & Copy Link

```
Implement share functionality with copy link and Web Share API:

1. Create `src/components/ShareButton.tsx`:
   - Button with "Share" label and icon
   - On click:
     - If mobile and Web Share API available: use navigator.share()
     - Else: copy link to clipboard
   - Shows success toast after copying
   - Props: url (string), title (string), text (optional)

2. Add share link generation:
   - Create `src/lib/shareUtils.ts`
   - `getPublicBoardUrl(shareToken: string)` - constructs full URL
   - Uses window.location.origin + /b/:shareToken

3. Update `src/components/PublicBoardHeader.tsx`:
   - Add ShareButton
   - Pass board share URL

4. Update `src/components/BoardPageHeader.tsx`:
   - Add ShareButton to private board view too
   - Pass board share URL

5. Add to BoardCard menu:
   - Update `src/components/BoardCardMenu.tsx`
   - Add "Share" menu item
   - Opens share dialog or copies link

6. Create `src/components/ShareDialog.tsx` (optional, for richer share UI):
   - Dialog showing share link
   - QR code (optional)
   - Copy button
   - Social share buttons (optional)

7. Write tests:
   - `src/__tests__/ShareButton.test.tsx`:
     - Test Web Share API on mobile
     - Test copy to clipboard on desktop
     - Test success toast
     - Mock navigator.share and Clipboard API

Ensure share URLs are fully qualified (include domain). Test on mobile devices.
```

---

### Step 9.3: Regenerate Share Link

```
Add ability to regenerate (rotate) share token to revoke old links:

1. Create `src/components/RegenerateShareTokenDialog.tsx`:
   - Confirmation dialog
   - Warning message: "This will invalidate the old share link. Anyone with the old link will lose access."
   - Shows current share URL (strikethrough after regeneration)
   - "Generate New Link" button
   - Uses useRegenerateShareToken mutation from 2.4

2. Update `src/hooks/useBoardMutations.ts`:
   - Ensure `useRegenerateShareToken()` exists
   - Mutation calls Supabase to update share_token with new UUID
   - Invalidates board queries
   - Returns new share token

3. Update `src/components/BoardCardMenu.tsx`:
   - Add "Regenerate link" menu item
   - Opens RegenerateShareTokenDialog

4. Update `src/components/BoardPageHeader.tsx`:
   - Add "Regenerate link" to board menu (three-dot)
   - Opens RegenerateShareTokenDialog

5. Show new link after regeneration:
   - RegenerateShareTokenDialog shows success state
   - Displays new share link
   - Copy button for new link
   - "Done" button closes dialog

6. Write tests:
   - `src/__tests__/RegenerateShareTokenDialog.test.tsx`:
     - Test confirmation flow
     - Test token regeneration
     - Test new link display
   - Test old link becomes invalid (404)

Ensure users understand the implications of regenerating (old link stops working).
```

---

## Phase 10: Advanced Features

### Step 10.1: Animated Board Covers (2×2 Rotating)

```
Implement animated rotating board covers for dashboard cards:

1. Create `src/components/RotatingBoardCover.tsx`:
   - 2×2 grid of image tiles
   - Each tile shows an image from board
   - Rotation logic:
     - If board has ≤4 images: show static (no rotation)
     - If >4 images: rotate through them
     - Staggered crossfade per tile (~2s per tile, ~8s full cycle)
     - Pause rotation on hover
     - Disable rotation on mobile if cover_rotation_enabled is false
   - Uses board_cover_images if customized, else uses first N images
   - Animation with CSS transitions or Framer Motion

2. Create `src/hooks/useCoverRotation.ts`:
   - Hook to manage cover rotation state
   - Returns current 4 image indices
   - Cycles through available images
   - Stagger: tile 0 changes, then 1s later tile 1, etc.
   - Pauses when paused prop is true
   - Uses setInterval or requestAnimationFrame

3. Update `src/components/BoardCard.tsx`:
   - Replace static thumbnails with RotatingBoardCover
   - Pass board images and cover_rotation_enabled setting

4. Add cover customization (basic):
   - Create `src/components/EditCoverDialog.tsx`
   - Shows all board images in grid
   - User can select up to 12 images for cover pool
   - Saves to board_cover_images table
   - Opens from BoardCard menu: "Edit cover"

5. Create schemas for board_cover_images:
   - Update `src/schemas/boardCoverImage.ts`
   - Schema for BoardCoverImage
   - Service functions in `src/services/boardCoverImages.ts`

6. Add toggle rotation setting:
   - Update `src/components/BoardCardMenu.tsx`
   - Add "Toggle rotation" menu item
   - Calls useUpdateBoard to toggle cover_rotation_enabled

7. Write tests:
   - `src/__tests__/RotatingBoardCover.test.tsx`:
     - Test rotation cycles through images
     - Test pause on hover
     - Test static display for ≤4 images
   - Mock setInterval/setTimeout

Optimize performance: pause rotation for offscreen cards (Intersection Observer).
```

---

### Step 10.2: Staging Area for Anonymous Users

```
Implement the anonymous staging area for unauthenticated users:

1. Update `src/pages/Staging.tsx`:
   - Shows drag-and-drop zone or upload button
   - Accepts up to 5 images (enforce limit)
   - Images stored in local state (not uploaded yet)
   - Shows preview grid (similar to ImageGrid but local files)
   - Cannot add captions or reorder (per spec)
   - Shows message: "Sign in to save these images to a board"
   - "Sign in with Google" button

2. Create `src/lib/stagingStorage.ts`:
   - Uses IndexedDB to persist staged images across OAuth redirect
   - `saveStagedImages(files: File[])` - saves files to IndexedDB
   - `getStagedImages()` - retrieves files from IndexedDB
   - `clearStagedImages()` - clears after saving to board

3. Handle OAuth redirect flow:
   - When user signs in from /staging:
     - Save images to IndexedDB before redirect
     - After OAuth callback, check IndexedDB for staged images
     - If found, open "Where to save?" modal

4. Create `src/components/SaveStagedImagesModal.tsx`:
   - Modal with two options:
     - "Create new board" (form with board name)
     - "Add to existing board" (searchable list of user boards)
   - After selection, upload all staged images to chosen board
   - Show upload progress
   - Clear IndexedDB on success
   - Navigate to board page

5. Update `src/pages/Home.tsx`:
   - If signed out, show hero section with:
     - Headline: "Capture your vibe."
     - Subtext: "Drop images and arrange them into living moodboards. Share instantly with a single link."
     - CTA button: "Create a board" → /staging

6. Write tests:
   - `src/__tests__/Staging.test.tsx`:
     - Test image drop and preview
     - Test 5-image limit
     - Test sign-in button
   - `src/__tests__/stagingStorage.test.ts`:
     - Test IndexedDB persistence
     - Mock IndexedDB
   - `src/__tests__/SaveStagedImagesModal.test.tsx`:
     - Test board selection and creation
     - Test upload after selection

Ensure IndexedDB works across OAuth redirect. Handle browsers that block 3rd-party cookies.
```

---

### Step 10.3: Homepage Showcase Board Animation

```
Implement the animated showcase board for signed-out homepage:

1. Create `src/components/ShowcaseBoard.tsx`:
   - Fetches showcase board using get_showcase_board RPC
   - Displays images in 3-column masonry layout
   - Animation (per spec):
     - 3 columns with alternating vertical drift (±24px)
     - 8s cycle per column, 1s stagger
     - Pause on hover
     - Disabled on mobile and for reduced-motion users
   - Uses CSS animations or Framer Motion

2. Create `src/hooks/useShowcaseBoard.ts`:
   - Fetches showcase board with TanStack Query
   - Query key: ['showcaseBoard']
   - Calls getShowcaseBoard() service (create this)

3. Create `src/services/showcaseBoard.ts`:
   - `getShowcaseBoard()` - calls get_showcase_board RPC
   - Parses with boardWithImages schema

4. Update `src/pages/Home.tsx` for signed-out view:
   - Two-column layout on desktop:
     - Left: ShowcaseBoard (2/3 width)
     - Right: Hero copy + CTA (1/3 width)
   - Single column on mobile: Hero copy at top, showcase below
   - Hero content:
     - Headline: "Capture your vibe."
     - Subtext: "Drop images and arrange them into living moodboards. Share instantly with a single link."
     - CTA: "Create a board" → /staging

5. Add masonry animation CSS:
   - Create `src/styles/showcase.css` (imported in index.css)
   - CSS keyframes for vertical drift
   - @media (prefers-reduced-motion: reduce) to disable
   - Pause animation on hover

6. Write tests:
   - `src/__tests__/ShowcaseBoard.test.tsx`:
     - Test showcase board renders
     - Test animation pauses on hover
     - Test responsive layout
   - Mock RPC call

Optimize performance: lazy-load showcase images. Consider Intersection Observer to start animation only when visible.
```

---

### Step 10.4: Bulk Move/Copy Between Boards

```
Implement bulk move and copy operations for images between boards:

1. Create `src/components/TransferImagesDialog.tsx`:
   - Dialog for moving/copying images to another board
   - Shows list of user's boards (searchable)
   - Thumbnail + name per board
   - Radio buttons: Copy (default) or Move
   - "Create new board" option at top
   - Transfer button
   - Props: imageIds (string[]), sourceBoardId (string)

2. Create `src/services/transferImages.ts`:
   - `transferImages(operation: 'copy' | 'move', sourceBoardId, destBoardId, imageIds)` - calls transfer_images Edge Function
   - Validates batch size (max 20 per spec)
   - Returns success/error

3. Create `src/hooks/useTransferImages.ts`:
   - Mutation hook for transfer operation
   - Invalidates queries for both source and dest boards
   - Shows progress toast (if batch is large)
   - Success toast: "3 images copied to Board Name"

4. Add "Transfer" to bulk selection toolbar:
   - Update `src/components/SelectionToolbar.tsx`
   - Add "Move/Copy to..." button
   - Opens TransferImagesDialog with selectedIds

5. Add drag-to-transfer UI (advanced):
   - Create `src/components/TransferTarget.tsx`
   - Component slides in at bottom-right during drag (only in selection mode)
   - Drop zone labeled "Transfer to..."
   - On drop, opens TransferImagesDialog

6. Handle "Create new board" in transfer dialog:
   - Inline form in TransferImagesDialog
   - Creates board, then transfers images
   - Navigates to new board after

7. Write tests:
   - `src/__tests__/TransferImagesDialog.test.tsx`:
     - Test board selection
     - Test copy vs move
     - Test new board creation
   - `src/__tests__/transferImages.test.ts`:
     - Test service function
     - Test batch limit (20)
     - Mock Edge Function

Ensure transfer operations are atomic (all succeed or all fail). Show clear error messages.
```

---

## Phase 11: Supabase Edge Functions (Backend)

### Step 11.1: import_from_url Edge Function

```
Implement the import_from_url Supabase Edge Function for server-side image importing:

1. Update `supabase/functions/import_from_url/index.ts`:
   - Verify JWT and get user ID
   - Validate request body: boardId (uuid), url (valid URL)
   - Check ownership: query boards table for boardId, verify owner_id matches user
   - Validate URL:
     - Fetch HEAD request first to check Content-Type and Content-Length
     - Ensure mime type is image/* (jpg, png, webp, gif)
     - Ensure size ≤10MB
   - Download image:
     - Fetch full image
     - Read as ArrayBuffer
   - Upload to Storage:
     - Generate UUID filename
     - Upload to board-images bucket at boards/{boardId}/{uuid}.{ext}
   - Extract dimensions (optional, can be done client-side):
     - Use image library if available in Deno
   - Insert image row:
     - Call add_image_at_top RPC (or direct insert at position 1, shifting others)
     - Store storage_path, mime_type, size_bytes, original_filename (from URL), source_url
   - Return created image object

2. Error handling:
   - 400 for invalid URL or validation failures
   - 403 for ownership violation
   - 413 for oversized images
   - 415 for unsupported media type
   - 500 for server errors

3. Add tests (Deno test):
   - Mock fetch calls
   - Test ownership check
   - Test file size/type validation
   - Test upload and DB insert

Follow Deno patterns. Use environment variables for service role key.
```

---

### Step 11.2: delete_images Edge Function

```
Implement the delete_images Edge Function for batch image deletion:

1. Update `supabase/functions/delete_images/index.ts`:
   - Verify JWT and get user ID
   - Validate request body: imageIds (array of uuids, length 1-100)
   - Query images with imageIds, join boards to get owner_id
   - Verify user owns all images (via board ownership)
   - For each image:
     - Delete storage object at storage_path
     - Collect errors but continue (don't fail entire batch on single storage error)
   - Delete image rows from DB (single DELETE query with IN clause)
   - Return summary: { deleted: number, errors: string[] }

2. Make deletion atomic where possible:
   - Use Postgres transaction for DB deletes
   - Storage deletes are separate (can fail independently)

3. Error handling:
   - 400 for invalid input
   - 403 for ownership violation
   - Return 200 with partial success if some storage deletes fail

4. Add tests:
   - Test ownership validation
   - Test batch delete
   - Test partial failure (some storage deletes fail)
   - Mock Supabase client

Ensure orphaned storage files are cleaned up (or logged for manual cleanup).
```

---

### Step 11.3: delete_board Edge Function

```
Implement the delete_board Edge Function for complete board deletion:

1. Update `supabase/functions/delete_board/index.ts`:
   - Verify JWT and get user ID
   - Validate request body: boardId (uuid)
   - Query board, verify owner_id matches user
   - Query all images in board
   - Delete all storage objects:
     - Batch delete from board-images bucket
     - Delete from avatars bucket if board had custom cover images
   - Delete board row (cascade deletes images, board_cover_images via FK)
   - Return success

2. Use transaction for DB operations:
   - Ensure board and all related rows deleted atomically

3. Handle storage deletion errors:
   - Continue even if some files fail to delete
   - Log errors for manual cleanup
   - Still delete DB rows (avoid orphaned DB records)

4. Error handling:
   - 400 for invalid boardId
   - 403 for ownership violation
   - 404 if board not found
   - 200 on success (even with storage errors)

5. Add tests:
   - Test ownership validation
   - Test cascade deletion
   - Test storage cleanup
   - Mock Supabase client

Ensure deletion cannot be triggered by non-owners (security-critical).
```

---

### Step 11.4: transfer_images Edge Function

```
Implement the transfer_images Edge Function for moving/copying images between boards:

1. Update `supabase/functions/transfer_images/index.ts`:
   - Verify JWT and get user ID
   - Validate request body:
     - operation: 'copy' | 'move'
     - sourceBoardId: uuid
     - destBoardId: uuid
     - imageIds: array of uuids (max 20)
   - Verify user owns both boards
   - Query images with imageIds from source board
   - For each image:
     - Copy storage file:
       - Download from source path
       - Upload to dest path: boards/{destBoardId}/{new-uuid}.{ext}
     - Insert new image row in dest board:
       - New ID, new board_id, new storage_path
       - Copy caption, source_url, mime_type, dimensions
       - Position: append to end (max position + 1)
   - If operation is 'move':
     - Delete original image rows
     - Delete original storage files
   - Return array of created images

2. Make operation atomic:
   - Use transaction for DB operations
   - On failure, clean up any partial uploads

3. Handle errors:
   - 400 for invalid input or batch too large
   - 403 for ownership violation
   - 500 for storage/DB errors
   - Rollback on failure

4. Optimize for batch:
   - Upload concurrently (Promise.all with limit)
   - Insert rows in single bulk INSERT query

5. Add tests:
   - Test copy operation
   - Test move operation (deletes originals)
   - Test ownership validation
   - Test batch limit
   - Mock storage and DB operations

Ensure Move operation is truly atomic (copy + delete, with rollback on failure).
```

---

## Phase 12: Deployment & SSR (Cloudflare Pages Functions)

### Step 12.1: OG Meta Tags SSR

```
Create Cloudflare Pages Function for SSR of OG meta tags on public board URLs:

1. Create `functions/b/[shareToken].ts`:
   - Cloudflare Pages Function (exports onRequest)
   - Intercepts requests to /b/:shareToken
   - Fetches board data via Supabase (use service role key)
   - Renders HTML with:
     - Standard meta tags
     - OG tags: og:title (board name), og:description, og:image (dynamic image URL)
     - Twitter card tags
     - robots: noindex, nofollow
   - Injects React app script tags
   - Returns Response with HTML

2. Fetch board data server-side:
   - Use Supabase client with service role key (from env)
   - Call get_public_board RPC
   - Handle 404 if board not found

3. Generate OG image URL:
   - Reference dynamic OG image endpoint (implement in 12.2)
   - URL: /api/og/:shareToken.png

4. HTML template:
   - Use template string with <!DOCTYPE html>
   - Inject meta tags in <head>
   - Include React root div and script tags
   - Ensure proper escaping of dynamic content

5. Add caching headers:
   - Cache-Control: public, max-age=86400 (24h)
   - ETag based on board.updated_at

6. Test locally with Wrangler:
   - npx wrangler pages dev

Write the function following Cloudflare Workers/Pages patterns. Use TypeScript.
```

---

### Step 12.2: Dynamic OG Image Generation

```
Create Cloudflare Pages Function for generating dynamic OG preview images:

1. Create `functions/api/og/[shareToken].png.ts`:
   - Cloudflare Pages Function for /api/og/:shareToken.png
   - Fetches board data (like 12.1)
   - Generates 1200×630 PNG image with board content:
     - 2×2 grid of images (from cover pool or first 4)
     - Board name text overlay (bottom-left, white with shadow)
     - "moodeight" wordmark (bottom-right, small)
   - Returns image as Response with Content-Type: image/png

2. Use image generation library:
   - Options for Cloudflare Workers:
     - @vercel/og (but designed for Vercel, may work on CF)
     - satori (render HTML/CSS to SVG, then convert to PNG)
     - sharp (if available in CF Workers)
   - Or use external service (Cloudinary, Imgix) to generate
   - Or use canvas API if available

3. Image composition:
   - Fetch 4 image thumbnails from Supabase Storage
   - Arrange in 2×2 grid (600×315 each)
   - Add text overlay with CSS/canvas drawing
   - If <4 images, repeat or use placeholder

4. Add caching:
   - Cache-Control: public, max-age=86400 (24h)
   - ETag based on board.updated_at
   - Store generated images in Cloudflare R2 or KV for faster serving

5. Fallback for no images:
   - Generate generic branded image with just board name

6. Test endpoint:
   - Verify images render correctly
   - Test caching behavior
   - Test with boards of varying image counts

This is complex due to image generation in Workers. Consider using external service if direct generation is too difficult.
```

---

### Step 12.3: Environment & Deployment Config

```
Set up deployment configuration for Cloudflare Pages:

1. Create `wrangler.toml`:
   - Configure Pages project
   - Set environment variables:
     - SUPABASE_URL
     - SUPABASE_SERVICE_ROLE_KEY (secret)
   - Configure routes and functions directory

2. Update `.env.example`:
   - Add all required environment variables
   - Include notes on where to get values (Supabase dashboard)

3. Create deployment scripts:
   - Update `package.json` scripts:
     - `deploy`: Build and deploy to Cloudflare Pages
     - `preview`: Deploy to preview environment

4. Add GitHub Actions workflow (optional):
   - `.github/workflows/deploy.yml`
   - Triggers on push to main
   - Steps:
     - Install dependencies
     - Run tests
     - Build
     - Deploy to Cloudflare Pages

5. Configure Cloudflare Pages project:
   - Connect GitHub repo
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Set environment variables (secrets)

6. Update README:
   - Add deployment instructions
   - Document environment variables
   - Include Cloudflare Pages setup steps

7. Test deployment:
   - Deploy to preview environment
   - Verify all features work in production
   - Test OG meta tags and images

Ensure secrets are never committed to repo. Use Cloudflare's secret management.
```

---

## Phase 13: Polish & Optimization

### Step 13.1: Loading States & Skeleton Screens

```
Add skeleton loading states for better perceived performance:

1. Create `src/components/Skeleton.tsx`:
   - Base skeleton component
   - Animated shimmer effect (CSS or Framer Motion)
   - Props: width, height, variant ('rect' | 'circle' | 'text')

2. Create skeleton variants:
   - `src/components/BoardCardSkeleton.tsx` - skeleton for board cards
   - `src/components/ImageGridSkeleton.tsx` - skeleton for image grid
   - `src/components/LightboxSkeleton.tsx` - skeleton for lightbox loading

3. Update loading states:
   - Replace spinners with skeletons where appropriate:
     - Dashboard: show grid of BoardCardSkeleton while loading
     - BoardPage: show ImageGridSkeleton while loading
     - Lightbox: show image skeleton while image loads
   - Keep spinners for actions (button loading states)

4. Add progressive image loading:
   - Update `src/components/ImageGridItem.tsx`:
     - Show blurred thumbnail while full image loads
     - Use blur-up technique (load tiny thumb first, then full)
   - Or use native loading="lazy" with placeholder

5. Optimize bundle size:
   - Lazy-load heavy components:
     - Lightbox (React.lazy)
     - CreateBoardModal
     - Large dialogs
   - Add Suspense boundaries with skeletons

6. Write tests:
   - Test skeletons render correctly
   - Test lazy loading works
   - Test progressive image loading

Ensure smooth transitions from skeleton to content. Use CSS contain for better layout performance.
```

---

### Step 13.2: Error Handling & Retry Logic

```
Improve error handling and add retry mechanisms:

1. Create `src/components/ErrorBoundary.tsx` (if not exists):
   - React error boundary component
   - Catches errors in component tree
   - Shows fallback UI with error message
   - "Try again" button to reset error state
   - Logs errors to console (or external service)

2. Wrap key sections with ErrorBoundary:
   - Wrap routes in App.tsx
   - Wrap dashboard
   - Wrap board page
   - Wrap lightbox

3. Enhance query error handling:
   - Update TanStack Query config in `src/lib/queryClient.ts`:
     - Retry logic: 3 retries with exponential backoff
     - onError callback for global error handling
   - Add query-specific error boundaries where needed

4. Create `src/components/QueryErrorBoundary.tsx`:
   - Uses TanStack Query's error boundary
   - Shows specific errors for query failures
   - "Retry" button triggers refetch

5. Add network error detection:
   - Create `src/hooks/useNetworkStatus.ts`
   - Detects online/offline status
   - Shows banner when offline: "You're offline. Some features may not work."

6. Handle specific error types:
   - 404: Show custom 404 page
   - 403: Show "Access denied" message
   - 500: Show "Something went wrong" with retry
   - Network errors: Show offline message

7. Write tests:
   - Test error boundaries catch errors
   - Test retry logic works
   - Test offline detection
   - Simulate various error scenarios

Provide helpful error messages. Avoid technical jargon in user-facing errors.
```

---

### Step 13.3: Performance Optimization

```
Optimize performance across the application:

1. Image loading optimizations:
   - Ensure srcset is used everywhere
   - Lazy load images below the fold (loading="lazy")
   - Use Intersection Observer for advanced lazy loading
   - Preload critical images (cover images on dashboard)

2. Code splitting:
   - Split routes (already done with React Router)
   - Lazy load modals and dialogs
   - Dynamic import for heavy libraries (e.g., image editing)

3. Memoization:
   - Use React.memo for expensive components:
     - BoardCard
     - ImageGridItem
     - Lightbox
   - Use useMemo for expensive computations
   - Use useCallback for event handlers passed as props

4. Virtual scrolling (if needed):
   - If boards or images >100 items, implement virtual scrolling
   - Use react-window or react-virtuoso
   - Apply to:
     - Dashboard board list
     - Image grid (if very large boards)
     - Lightbox thumbnail strip

5. Optimize animations:
   - Use CSS transforms (GPU-accelerated)
   - Add will-change: transform to dragged items
   - Use Framer Motion's layoutId for shared element transitions
   - Reduce motion for reduced-motion users

6. Bundle optimization:
   - Tree-shake unused code
   - Analyze bundle with vite-bundle-visualizer
   - Split vendor chunks appropriately
   - Use compression (gzip/brotli)

7. Caching strategy:
   - Configure TanStack Query staleTime and cacheTime
   - Use SWR pattern (stale-while-revalidate)
   - Cache API responses appropriately

8. Lighthouse audit:
   - Run Lighthouse on deployed app
   - Aim for >90 in all categories
   - Fix reported issues

9. Write performance tests:
   - Test virtual scrolling with large datasets
   - Test animation performance
   - Test image loading performance

Monitor performance in production with Web Vitals. Set up alerting for regressions.
```

---

### Step 13.4: Accessibility Audit & Fixes

```
Conduct accessibility audit and fix issues:

1. Keyboard navigation:
   - Ensure all interactive elements are keyboard accessible
   - Add visible focus indicators (outline, ring)
   - Proper tab order (tabindex where needed)
   - Keyboard shortcuts don't conflict with browser/screen reader
   - Test entire app with keyboard only

2. Screen reader support:
   - Add proper ARIA labels and roles:
     - Images: alt text from captions
     - Buttons: aria-label when icon-only
     - Dialogs: aria-modal, aria-labelledby
     - Menus: proper ARIA menu pattern
   - Use semantic HTML: <nav>, <main>, <header>, <button>
   - Test with screen reader (NVDA, JAWS, VoiceOver)

3. Focus management:
   - Focus trap in modals (Radix UI handles this)
   - Return focus after closing modal
   - Focus first element in dialogs on open
   - Skip links for main content

4. Color contrast:
   - Ensure all text meets WCAG AA (4.5:1 for normal text)
   - Test with contrast checker
   - Don't rely on color alone for information

5. Responsive & zoom:
   - Test at 200% browser zoom
   - Ensure nothing breaks at various viewport sizes
   - Touch targets ≥44×44px on mobile

6. Forms:
   - Proper labels for all inputs
   - Error messages associated with inputs (aria-describedby)
   - Required fields marked (aria-required or required)
   - Validation errors announced to screen readers

7. Animations & motion:
   - Respect prefers-reduced-motion
   - Disable animations for reduced-motion users
   - Provide static alternatives

8. Run automated audits:
   - axe DevTools or Lighthouse accessibility audit
   - Fix all reported issues
   - Aim for zero violations

9. Write accessibility tests:
   - Use @testing-library/jest-dom matchers
   - Test keyboard navigation
   - Test ARIA attributes
   - Use jest-axe for automated a11y testing in tests

Accessibility is not optional. Ensure app is usable by everyone.
```

---

## Phase 14: Final Testing & QA

### Step 14.1: Integration Testing

```
Write comprehensive integration tests for key user flows:

1. Create integration test suites:
   - `src/__tests__/integration/authFlow.test.tsx`:
     - Sign in with Google (mock OAuth)
     - Profile creation
     - Sign out
   - `src/__tests__/integration/boardManagement.test.tsx`:
     - Create board
     - Rename board
     - Delete board
   - `src/__tests__/integration/imageUpload.test.tsx`:
     - Upload images
     - Edit captions
     - Delete images
     - Reorder images
   - `src/__tests__/integration/publicSharing.test.tsx`:
     - Share board
     - View public board
     - Regenerate link
   - `src/__tests__/integration/stagingFlow.test.tsx`:
     - Drop images in staging
     - Sign in
     - Save to new board
     - Save to existing board

2. Use React Testing Library + MSW:
   - Mock all API calls with MSW
   - Simulate user interactions
   - Assert on UI changes and side effects

3. Test error scenarios:
   - Network failures
   - Validation errors
   - Permission errors
   - Race conditions

4. Test edge cases:
   - Empty states
   - Maximum limits (e.g., 5 images in staging)
   - Concurrent operations
   - Browser back/forward

5. Run tests in CI:
   - Ensure all tests pass before merge
   - Set up pre-commit hook to run tests

Use realistic test data. Cover happy paths and error paths.
```

---

### Step 14.2: E2E Testing with Playwright

```
Set up end-to-end testing with Playwright:

1. Install Playwright:
   - npm install -D @playwright/test
   - npx playwright install

2. Create `playwright.config.ts`:
   - Configure base URL (local dev server)
   - Set up test timeouts
   - Configure browsers (chromium, webkit, firefox)

3. Write E2E tests in `e2e/` directory:
   - `e2e/auth.spec.ts`:
     - Sign in flow (mock OAuth in test env)
     - Sign out
   - `e2e/boards.spec.ts`:
     - Create board
     - Upload images
     - Drag and reorder
     - View in lightbox
     - Edit caption
     - Delete image
   - `e2e/sharing.spec.ts`:
     - Share board
     - Open public link in new context
     - Verify read-only view
   - `e2e/staging.spec.ts`:
     - Anonymous staging
     - Sign in flow
     - Save to board

4. Use Playwright's features:
   - Auto-waiting
   - Screenshots on failure
   - Video recording
   - Network mocking

5. Set up test database:
   - Use separate Supabase project for testing
   - Or use local Supabase with Docker

6. Run in CI:
   - Add Playwright to GitHub Actions
   - Run on PRs
   - Store artifacts (screenshots, videos)

E2E tests catch integration issues unit tests miss. Keep tests fast and reliable.
```

---

### Step 14.3: Manual QA Checklist

```
Create comprehensive manual QA checklist and perform testing:

1. Create QA checklist document:
   - Authentication:
     - [ ] Sign in with Google works
     - [ ] Profile creation works
     - [ ] Sign out works
     - [ ] Auth persists across page reload
   - Board Management:
     - [ ] Create board works
     - [ ] Rename board works
     - [ ] Delete board works (with confirmation)
     - [ ] Board list shows correct data
     - [ ] Board covers rotate (when enabled)
   - Image Upload:
     - [ ] Upload via button works
     - [ ] Drag-and-drop works
     - [ ] Paste works (Ctrl+V)
     - [ ] Multiple concurrent uploads work (4 max)
     - [ ] Upload progress shown
     - [ ] Errors handled gracefully
   - Image Management:
     - [ ] Drag to reorder works
     - [ ] Edit caption works
     - [ ] Delete image works
     - [ ] Bulk selection works
     - [ ] Bulk delete works
   - Lightbox:
     - [ ] Opens on image click
     - [ ] Keyboard navigation works (arrows, Esc)
     - [ ] Zoom/pan works (wheel, pinch, double-click)
     - [ ] Thumbnail strip works (desktop)
     - [ ] Swipe gestures work (mobile)
     - [ ] Download works
     - [ ] Copy URL works
   - Public Sharing:
     - [ ] Share link works
     - [ ] Public view is read-only
     - [ ] Regenerate link invalidates old link
     - [ ] OG meta tags render (check in link previews)
   - Staging:
     - [ ] Anonymous drop works
     - [ ] 5-image limit enforced
     - [ ] Sign in flow persists images
     - [ ] Save to new/existing board works
   - Responsive:
     - [ ] Mobile layout works
     - [ ] Tablet layout works
     - [ ] Desktop layout works
     - [ ] All breakpoints tested
   - Theme:
     - [ ] Theme toggle works
     - [ ] System theme detection works
     - [ ] Theme persists across sessions
   - Performance:
     - [ ] Pages load quickly (<2s)
     - [ ] Images lazy load
     - [ ] Animations smooth (60fps)
     - [ ] No memory leaks
   - Accessibility:
     - [ ] Keyboard navigation works
     - [ ] Screen reader works
     - [ ] Focus indicators visible
     - [ ] Color contrast sufficient

2. Test on multiple browsers:
   - Chrome, Firefox, Safari, Edge
   - Mobile: iOS Safari, Android Chrome

3. Test on various devices:
   - Desktop (various resolutions)
   - Tablet (iPad, Android)
   - Mobile (iPhone, Android)

4. Test network conditions:
   - Fast 4G
   - Slow 3G
   - Offline (where applicable)

5. Create bug tracking document:
   - Log all found issues
   - Prioritize (P0-P3)
   - Assign to fix

6. Perform regression testing after fixes

Thorough QA catches issues automated tests miss. Involve multiple testers if possible.
```

---

## Execution Summary

This blueprint provides **14 phases** with **52 detailed, step-by-step prompts** for building the Moodeight moodboard application using test-driven development and incremental progress.

### Key Principles:

- **Test-driven**: Every step includes comprehensive tests
- **Incremental**: Small, safe chunks building on each other
- **Type-safe**: Strong TypeScript typing throughout
- **Best practices**: Accessibility, performance, error handling
- **Integrated**: No orphaned code, everything wired together

### Recommended Execution:

1. **Phases 1-2**: Foundation (auth, Supabase, data layer) - ~8-10 prompts
2. **Phases 3-5**: Core UI (theme, layout, boards, images) - ~12-14 prompts
3. **Phases 6-7**: Interactions (drag-drop, lightbox) - ~6 prompts
4. **Phases 8-10**: Advanced features (management, sharing, staging) - ~12 prompts
5. **Phase 11**: Backend (Edge Functions) - ~4 prompts
6. **Phase 12**: Deployment (SSR, OG images) - ~3 prompts
7. **Phases 13-14**: Polish & QA - ~7 prompts

Each prompt is designed for autonomous implementation by a code-generation LLM with clear requirements, context, and testing guidelines.
