import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeleteBoardDialog } from '@/components/DeleteBoardDialog';
import * as useBoardMutations from '@/hooks/useBoardMutations';
import { useAuth } from '@/hooks/useAuth';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/lib/toast', () => ({
  toast: {
    success: (message: string) => toastSuccess(message),
    error: (message: string) => toastError(message),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/hooks/useBoardMutations');
vi.mock('@/hooks/useAuth');

describe('DeleteBoardDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useAuth as any).mockReturnValue({
      user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' },
      loading: false,
    });
  });

  const renderDialog = (
    props: {
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      boardId?: string;
      boardName?: string;
    } = {},
    options: { mutateAsync?: ReturnType<typeof vi.fn>; isPending?: boolean } = {},
    route: string = '/',
  ) => {
    const mutateAsync = options.mutateAsync ?? vi.fn();
    (useBoardMutations.useDeleteBoard as any).mockReturnValue({
      mutateAsync,
      isPending: options.isPending ?? false,
    });

    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      boardId: 'board-123',
      boardName: 'My Board',
      ...props,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="*" element={<DeleteBoardDialog {...defaultProps} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return { mutateAsync, onOpenChange: defaultProps.onOpenChange };
  };

  it('displays warning message about permanent deletion', () => {
    renderDialog();

    expect(
      screen.getByText(/This will permanently delete all images and data/i),
    ).toBeInTheDocument();
  });

  it('requires user to type board name to confirm', () => {
    renderDialog({ boardName: 'Inspiration Board' });

    expect(screen.getByText(/Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Inspiration Board/i)).toBeInTheDocument();
  });

  it('disables delete button until name matches', () => {
    renderDialog({ boardName: 'My Board' });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    expect(deleteButton).toBeDisabled();

    const input = screen.getByPlaceholderText('My Board');
    fireEvent.change(input, { target: { value: 'Wrong Name' } });

    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'My Board' } });

    expect(deleteButton).not.toBeDisabled();
  });

  it('performs case-sensitive name matching', () => {
    renderDialog({ boardName: 'My Board' });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    const input = screen.getByPlaceholderText('My Board');

    fireEvent.change(input, { target: { value: 'my board' } });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'My Board' } });
    expect(deleteButton).not.toBeDisabled();
  });

  it('trims whitespace when matching name', () => {
    renderDialog({ boardName: 'My Board' });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    const input = screen.getByPlaceholderText('My Board');

    fireEvent.change(input, { target: { value: '  My Board  ' } });
    expect(deleteButton).not.toBeDisabled();
  });

  it('deletes board and shows success toast', async () => {
    const onOpenChange = vi.fn();
    const { mutateAsync } = renderDialog(
      { onOpenChange, boardId: 'board-123', boardName: 'My Board' },
      {
        mutateAsync: vi.fn().mockResolvedValue({}),
      },
    );

    const input = screen.getByPlaceholderText('My Board');
    fireEvent.change(input, { target: { value: 'My Board' } });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('board-123');
    });

    expect(toastSuccess).toHaveBeenCalledWith('Board deleted');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('navigates to home when deleting from board page', async () => {
    const { mutateAsync } = renderDialog(
      { boardId: 'board-123', boardName: 'My Board' },
      {
        mutateAsync: vi.fn().mockResolvedValue({}),
      },
      '/boards/board-123',
    );

    const input = screen.getByPlaceholderText('My Board');
    fireEvent.change(input, { target: { value: 'My Board' } });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('does not navigate when deleting from other pages', async () => {
    const { mutateAsync } = renderDialog(
      { boardId: 'board-123', boardName: 'My Board' },
      {
        mutateAsync: vi.fn().mockResolvedValue({}),
      },
      '/', // Home page
    );

    const input = screen.getByPlaceholderText('My Board');
    fireEvent.change(input, { target: { value: 'My Board' } });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows error toast on failure', async () => {
    const { mutateAsync } = renderDialog(
      { boardName: 'My Board' },
      {
        mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    );

    const input = screen.getByPlaceholderText('My Board');
    fireEvent.change(input, { target: { value: 'My Board' } });

    const deleteButton = screen.getByRole('button', { name: /delete board/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Network error');
    });

    expect(mutateAsync).toHaveBeenCalled();
  });

  it('shows loading state during deletion', async () => {
    renderDialog(
      { boardName: 'My Board' },
      {
        isPending: true,
        mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})),
      },
    );

    const input = screen.getByPlaceholderText('My Board');
    fireEvent.change(input, { target: { value: 'My Board' } });

    expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clears input when dialog is reopened', () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DeleteBoardDialog
            open={false}
            onOpenChange={vi.fn()}
            boardId="board-123"
            boardName="My Board"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    (useBoardMutations.useDeleteBoard as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    // Reopen dialog
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DeleteBoardDialog
            open={true}
            onOpenChange={vi.fn()}
            boardId="board-123"
            boardName="My Board"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const input = screen.getByPlaceholderText('My Board') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
