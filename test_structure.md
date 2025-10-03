# Test Structure Guide

This document outlines the testing patterns and setup requirements for the Moodeight project.

## Table of Contents
- [General Testing Principles](#general-testing-principles)
- [Test File Structure](#test-file-structure)
- [Common Test Setup Patterns](#common-test-setup-patterns)
- [React Component Testing](#react-component-testing)
- [Service Layer Testing](#service-layer-testing)
- [Hook Testing](#hook-testing)
- [Drag-and-Drop Testing](#drag-and-drop-testing)
- [Best Practices](#best-practices)

## General Testing Principles

### Test Framework
- **Vitest** for test runner
- **React Testing Library** for component testing
- **MSW** for mocking HTTP requests
- **jsdom** for DOM environment

### Test File Location
- Tests are located in `src/__tests__/`
- Test files are named `ComponentName.test.tsx` or `serviceName.test.ts`
- Can be co-located with components or centralized in `__tests__` directory

### Running Tests
```bash
npm test              # Watch mode
npm test -- --run     # Run once
npm test -- <file>    # Run specific test file
```

## Test File Structure

### Basic Template
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// Import component/service under test

// Mock external dependencies first
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

## Common Test Setup Patterns

### 1. Mocking the Header Component
Most page components use the `Header` component which requires `AuthProvider`. To avoid this dependency in tests, mock the Header:

```typescript
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));
```

### 2. Mocking Supabase Client
When testing components that use Supabase directly:

```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      }),
    },
  },
}));
```

### 3. Mocking Service Layer
When testing components that call service functions:

```typescript
import * as boardsService from '@/services/boards';

vi.mock('@/services/boards');

// In test
vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);
```

### 4. Mocking React Router
When testing components that use navigation:

```typescript
const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});
```

### 5. Mocking Custom Hooks
When testing components that use custom hooks (e.g., `useAuth`):

```typescript
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

const mockUseAuth = vi.mocked(useAuth);

// In test
mockUseAuth.mockReturnValue({
  user: { id: '123', email: 'test@example.com' },
  loading: false,
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
});
```

## React Component Testing

### Components Using TanStack Query

Components that use TanStack Query hooks (e.g., `useQuery`, `useMutation`) must be wrapped with `QueryClientProvider`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Usage
it('fetches and displays data', async () => {
  vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

  renderWithQueryClient(<BoardPage />);

  await waitFor(() => {
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });
});
```

### Components Using React Router

Components that use routing must be wrapped with `MemoryRouter`:

```typescript
import { MemoryRouter, Routes, Route } from 'react-router-dom';

function renderBoardPage(boardId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/boards/${boardId}`]}>
        <Routes>
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
```

### Handling React StrictMode Double Rendering

React StrictMode renders components twice in development, which can cause issues with `screen.getByRole()` and `screen.getByText()` queries finding multiple elements. Use `container.querySelector()` for single-element queries:

```typescript
// ❌ Will fail in StrictMode
const img = screen.getByRole('img');

// ✅ Use container.querySelector instead
const { container } = render(<ImageGridItem image={mockImage} />);
const img = container.querySelector('img');
expect(img).toBeInTheDocument();

// ✅ Or use getAllByRole and select the first element
const images = screen.getAllByRole('img');
expect(images[0]).toHaveAttribute('alt', 'Test Caption');

// ✅ For multiple elements, use querySelectorAll
const { container } = render(<ImageGrid images={mockImages} />);
const images = container.querySelectorAll('img');
expect(images).toHaveLength(3);
```

### Testing Async Components

Use `waitFor` for async operations:

```typescript
it('shows error message when fetch fails', async () => {
  vi.mocked(boardsService.getBoard).mockRejectedValue(
    new Error('Failed to fetch board')
  );

  renderBoardPage(mockBoard.id);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch board')).toBeInTheDocument();
  });
});
```

### Testing Loading States

Test loading states by using a promise that never resolves:

```typescript
it('shows loading spinner while fetching board', () => {
  vi.mocked(boardsService.getBoard).mockImplementation(
    () => new Promise(() => {}) // Never resolves
  );

  renderBoardPage(mockBoard.id);

  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

## Service Layer Testing

### Testing Service Functions

```typescript
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getBoard } from '@/services/boards';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('boards service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches board with images', async () => {
    const mockData = {
      id: '123',
      name: 'Test Board',
      images: [],
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockData,
            error: null
          }),
        }),
      }),
    } as any);

    const result = await getBoard('123');
    expect(result).toEqual(mockData);
  });
});
```

## Hook Testing

### Testing Custom Hooks with TanStack Query

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBoard } from '@/hooks/useBoard';
import * as boardsService from '@/services/boards';

vi.mock('@/services/boards');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

it('fetches board data', async () => {
  vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

  const { result } = renderHook(() => useBoard('123'), {
    wrapper: createWrapper(),
  });

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toEqual(mockBoard);
});
```

## Best Practices

### Drag-and-Drop Testing

- Prefer mocking `@dnd-kit` hooks/components rather than triggering pointer events. `src/__tests__/SortableImageGrid.test.tsx` demonstrates hoisting handler refs so tests can call `onDragStart`/`onDragEnd` directly.
- Mock `arrayMove` from `@dnd-kit/sortable` to ensure deterministic ordering.
- Verify both DOM order and the reorder callback (`queueReorder`) to cover UI updates and mutation scheduling.

### Hook Testing Enhancements

- Hooks with debounced effects (e.g., `useImageReorder`) should be tested with fake timers. Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`.
- Advance timers inside an `act()` block and `await Promise.resolve()` to flush queued microtasks after `vi.advanceTimersByTime`.
- When mutating TanStack Query cache optimistically, snapshot the query data before the mutation and assert both optimistic and reverted states.

### 1. Mock Data Organization

Keep mock data at the top of the test file for reusability:

```typescript
const mockBoard: BoardWithImages = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  owner_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Board',
  description: 'A test board',
  share_token: '123e4567-e89b-12d3-a456-426614174002',
  cover_rotation_enabled: true,
  is_showcase: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  images: [],
};
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good
it('shows error message when board fetch fails', () => {});
it('renders board header with name and description', () => {});

// ❌ Bad
it('test 1', () => {});
it('works', () => {});
```

### 3. Clean Up Between Tests

Always clean up mocks and state:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 4. Test User Interactions with fireEvent or userEvent

```typescript
import { fireEvent } from '@testing-library/react';

it('calls onClick when image is clicked', () => {
  const onClick = vi.fn();
  const { container } = render(<ImageGridItem image={mockImage} onClick={onClick} />);

  const imageWrapper = container.querySelector('.group');
  fireEvent.click(imageWrapper!);

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

### 5. Test Accessibility

Use semantic queries when possible:

```typescript
// ✅ Preferred (accessible queries)
screen.getByRole('button', { name: 'Upload' })
screen.getByRole('alert')
screen.getByRole('status')
screen.getByLabelText('Board name')

// ⚠️ Use only when necessary
container.querySelector('.specific-class')
screen.getByTestId('custom-element')
```

### 6. Test Error States

```typescript
it('shows error message when board is not found', async () => {
  vi.mocked(boardsService.getBoard).mockRejectedValue(
    new Error('Board not found')
  );

  renderBoardPage('non-existent-id');

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Board not found')).toBeInTheDocument();
  });
});
```

### 7. Test Empty States

```typescript
it('renders empty state when board has no images', async () => {
  const emptyBoard = { ...mockBoard, images: [] };
  vi.mocked(boardsService.getBoard).mockResolvedValue(emptyBoard);

  renderBoardPage(emptyBoard.id);

  await waitFor(() => {
    expect(screen.getByText('No images yet')).toBeInTheDocument();
    expect(screen.getByText('Upload images to get started')).toBeInTheDocument();
  });
});
```

## Common Pitfalls

### 1. Forgetting to Mock Dependencies
Always mock components that require complex providers (Auth, Theme, etc.):
```typescript
// Mock before importing component
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));
```

### 2. Not Wrapping with QueryClientProvider
Components using TanStack Query hooks will error without the provider:
```typescript
// ❌ Will fail
render(<BoardPage />);

// ✅ Correct
render(
  <QueryClientProvider client={queryClient}>
    <BoardPage />
  </QueryClientProvider>
);
```

### 3. Using screen.getByRole in StrictMode
StrictMode renders twice, causing multiple elements to match:
```typescript
// ❌ Fails with "Found multiple elements"
const img = screen.getByRole('img');

// ✅ Use container.querySelector
const { container } = render(<Component />);
const img = container.querySelector('img');
```

### 4. Not Awaiting Async Operations
Always use `waitFor` for async state changes:
```typescript
// ❌ Will fail
expect(screen.getByText('Loaded')).toBeInTheDocument();

// ✅ Correct
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Example: Complete Test File

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardPage from '@/pages/BoardPage';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import * as boardsService from '@/services/boards';

// Mock Header to avoid AuthProvider dependency
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

// Mock service
vi.mock('@/services/boards');

// Mock data
const mockBoard: BoardWithImages = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  owner_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Board',
  description: 'A test board description',
  share_token: '123e4567-e89b-12d3-a456-426614174002',
  cover_rotation_enabled: true,
  is_showcase: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  images: [],
};

// Helper function
function renderBoardPage(boardId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/boards/${boardId}`]}>
        <Routes>
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching board', () => {
    vi.mocked(boardsService.getBoard).mockImplementation(
      () => new Promise(() => {})
    );

    renderBoardPage(mockBoard.id);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders board data when loaded', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
      expect(screen.getByText('A test board description')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(boardsService.getBoard).mockRejectedValue(
      new Error('Failed to fetch board')
    );

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch board')).toBeInTheDocument();
    });
  });
});
```

## Quick Reference Checklist

When writing a new test:

- [ ] Import Vitest utilities (`describe`, `it`, `expect`, `vi`, `beforeEach`)
- [ ] Import React Testing Library (`render`, `screen`, `waitFor`, `fireEvent`)
- [ ] Mock `Header` component if testing a page
- [ ] Mock service layer functions if component uses them
- [ ] Mock custom hooks if component uses them
- [ ] Wrap with `QueryClientProvider` if component uses TanStack Query
- [ ] Wrap with `MemoryRouter` if component uses React Router
- [ ] Use `container.querySelector()` for single elements in StrictMode
- [ ] Use `waitFor()` for async operations
- [ ] Clean up mocks with `vi.clearAllMocks()` in `beforeEach`
- [ ] Test loading, success, error, and empty states
- [ ] Use semantic queries when possible (`getByRole`, `getByLabelText`)
- [ ] Write descriptive test names

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Documentation](https://testing-library.com/react)
- [TanStack Query Testing Guide](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
