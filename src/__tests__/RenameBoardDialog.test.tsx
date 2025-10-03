import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenameBoardDialog } from '@/components/RenameBoardDialog';
import * as useBoardMutations from '@/hooks/useBoardMutations';
import { useAuth } from '@/hooks/useAuth';

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

describe('RenameBoardDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
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
      currentName?: string;
    } = {},
    options: { mutateAsync?: ReturnType<typeof vi.fn>; isPending?: boolean } = {},
  ) => {
    const mutateAsync = options.mutateAsync ?? vi.fn();
    (useBoardMutations.useUpdateBoard as any).mockReturnValue({
      mutateAsync,
      isPending: options.isPending ?? false,
    });

    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      boardId: 'board-123',
      currentName: 'My Board',
      ...props,
    };

    render(
      <QueryClientProvider client={queryClient}>
        <RenameBoardDialog {...defaultProps} />
      </QueryClientProvider>,
    );

    return { mutateAsync, onOpenChange: defaultProps.onOpenChange };
  };

  it('pre-fills the form with current board name', () => {
    renderDialog({ currentName: 'Inspiration Board' });

    const input = screen.getByLabelText(/Board name/i) as HTMLInputElement;
    expect(input.value).toBe('Inspiration Board');
  });

  it('validates that board name is required', async () => {
    const { mutateAsync } = renderDialog();

    const input = screen.getByLabelText(/Board name/i);
    fireEvent.change(input, { target: { value: '   ' } }); // Only whitespace

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/Board name is required/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('validates maximum length of 60 characters', async () => {
    const { mutateAsync } = renderDialog();

    const input = screen.getByLabelText(/Board name/i);
    fireEvent.change(input, { target: { value: 'a'.repeat(61) } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/Board name must be 60 characters or less/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('trims whitespace from board name', async () => {
    const { mutateAsync } = renderDialog(
      {},
      {
        mutateAsync: vi.fn().mockResolvedValue({}),
      },
    );

    const input = screen.getByLabelText(/Board name/i);
    fireEvent.change(input, { target: { value: '  New Name  ' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      boardId: 'board-123',
      data: { name: 'New Name' },
    });
  });

  it('submits form and closes dialog on success', async () => {
    const onOpenChange = vi.fn();
    const { mutateAsync } = renderDialog(
      { onOpenChange },
      {
        mutateAsync: vi.fn().mockResolvedValue({}),
      },
    );

    const input = screen.getByLabelText(/Board name/i);
    fireEvent.change(input, { target: { value: 'Updated Board' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      boardId: 'board-123',
      data: { name: 'Updated Board' },
    });
    expect(toastSuccess).toHaveBeenCalledWith('Board renamed');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error toast on failure', async () => {
    const { mutateAsync } = renderDialog(
      {},
      {
        mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    );

    const input = screen.getByLabelText(/Board name/i);
    fireEvent.change(input, { target: { value: 'Updated Board' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Network error');
    });

    expect(mutateAsync).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    renderDialog(
      {},
      {
        isPending: true,
        mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      },
    );

    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets form when dialog is reopened', () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <RenameBoardDialog
          open={false}
          onOpenChange={vi.fn()}
          boardId="board-123"
          currentName="Original Name"
        />
      </QueryClientProvider>,
    );

    (useBoardMutations.useUpdateBoard as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    // Reopen with new name
    rerender(
      <QueryClientProvider client={queryClient}>
        <RenameBoardDialog
          open={true}
          onOpenChange={vi.fn()}
          boardId="board-123"
          currentName="Updated Name"
        />
      </QueryClientProvider>,
    );

    const input = screen.getByLabelText(/Board name/i) as HTMLInputElement;
    expect(input.value).toBe('Updated Name');
  });
});
