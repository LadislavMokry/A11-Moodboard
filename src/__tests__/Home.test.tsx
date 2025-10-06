import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/pages/Home';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';

type UseBoardsReturn = ReturnType<typeof useBoards>;

defineHeaderMock();

type NavigateFn = (path: string, options?: { replace?: boolean }) => void;
const navigateMock: NavigateFn = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useBoards');
vi.mock('@/components/SignInButton', () => ({
  SignInButton: () => <button type="button">Sign in with Google</button>,
}));

function createBoardsReturn(partial: Partial<UseBoardsReturn>): UseBoardsReturn {
  return {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
    status: 'success',
    fetchStatus: 'idle',
    isIdle: false,
    isFetching: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    remove: vi.fn(),
    refetchPage: undefined as never,
    fetchNextPage: undefined as never,
    fetchPreviousPage: undefined as never,
    hasNextPage: undefined,
    hasPreviousPage: undefined,
    dataUpdateCount: 0,
    ...partial,
  } as UseBoardsReturn;
}

function defineHeaderMock() {
  vi.mock('@/components/Header', () => ({
    Header: () => <div data-testid="header" />,
  }));
}

const mockUseAuth = vi.mocked(useAuth);
const mockUseBoards = vi.mocked(useBoards);

const baseAuth = {
  user: null,
  loading: false,
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
};

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it('renders loading spinner while auth state initializes', () => {
    mockUseAuth.mockReturnValue({ ...baseAuth, loading: true });
    mockUseBoards.mockReturnValue(createBoardsReturn({}));

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading your session/i)).toBeInTheDocument();
  });

  it('renders board card skeletons while boards load', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      user: { id: 'user-1', email: 'user@example.com' } as any,
    });

    mockUseBoards.mockReturnValue(
      createBoardsReturn({
        isLoading: true,
        data: undefined,
      }),
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    const skeletons = screen.getAllByTestId('board-card-skeleton');
    expect(skeletons).toHaveLength(6);
  });

  it('renders boards grid when data is available', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
      },
    });

    const boards = [
      {
        id: '1f0c7dc1-9d75-4ea6-bbd2-7448d099d1e5',
        owner_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Inspiration Board',
        description: 'A collection of ideas',
        share_token: '2fcf3cda-7d22-4635-a42f-6be580a4d021',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ];

    mockUseBoards.mockReturnValue(
      createBoardsReturn({
        data: boards,
        isLoading: false,
        isError: false,
      }),
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText('Inspiration Board')).toBeInTheDocument();
    expect(screen.getByText(/A collection of ideas/i)).toBeInTheDocument();
  });

  it('redirects to staging when user has no boards', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
      },
    });

    mockUseBoards.mockReturnValue(
      createBoardsReturn({
        data: [],
        isLoading: false,
      }),
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/staging', { replace: true });
    });

    expect(screen.getByText(/Redirecting to staging/i)).toBeInTheDocument();
  });

  it('shows error message with retry button when query fails', () => {
    const retry = vi.fn();

    mockUseAuth.mockReturnValue({
      ...baseAuth,
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
      },
    });

    mockUseBoards.mockReturnValue(
      createBoardsReturn({
        isError: true,
        error: new Error('Network error'),
        refetch: retry,
      }),
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();

    screen.getByRole('button', { name: /retry/i }).click();
    expect(retry).toHaveBeenCalled();
  });
});
