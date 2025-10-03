import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ComponentProps } from 'react';
import { CreateBoardModal } from '@/components/CreateBoardModal';
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

vi.mock('@/hooks/useBoardMutations');
vi.mock('@/hooks/useAuth');

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/lib/toast', () => ({
  toast: {
    success: (message: string) => toastSuccess(message),
    error: (message: string) => toastError(message),
    dismiss: vi.fn(),
  },
}));

describe('CreateBoardModal', () => {
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

  const renderModal = (
    props: Partial<ComponentProps<typeof CreateBoardModal>> = {},
    options: { mutateAsync?: ReturnType<typeof vi.fn>; isPending?: boolean } = {},
  ) => {
    const mutateAsync = options.mutateAsync ?? vi.fn();
    (useBoardMutations.useCreateBoard as any).mockReturnValue({
      mutateAsync,
      isPending: options.isPending ?? false
    });

    const defaultProps: ComponentProps<typeof CreateBoardModal> = {
      open: true,
      onOpenChange: vi.fn(),
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CreateBoardModal {...defaultProps} {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return { mutateAsync, onOpenChange: props.onOpenChange ?? defaultProps.onOpenChange };
  };

  it('validates board name is required', async () => {
    const { mutateAsync } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    expect(await screen.findByText(/Board name is required/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('enforces maximum lengths for name and description', async () => {
    renderModal();

    const nameInput = screen.getByLabelText(/Board name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(61) } });

    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    fireEvent.change(descriptionInput, { target: { value: 'b'.repeat(161) } });

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    expect(await screen.findByText(/Board name must be 60 characters or less/i)).toBeInTheDocument();
    expect(await screen.findByText(/Description must be 160 characters or less/i)).toBeInTheDocument();
  });

  it('submits form and navigates on success', async () => {
    const onOpenChange = vi.fn();
    const { mutateAsync } = renderModal({ onOpenChange }, {
      mutateAsync: vi.fn().mockResolvedValue({ id: 'board-1' }),
    });

    fireEvent.change(screen.getByLabelText(/Board name/i), { target: { value: '  Inspiration ' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: ' Moodboard description. ' } });

    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Inspiration',
      description: 'Moodboard description.',
      cover_rotation_enabled: true,
      is_showcase: false,
    });
    expect(toastSuccess).toHaveBeenCalledWith('Board created');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith('/boards/board-1');
  });

  it('shows error toast on failure', async () => {
    const { mutateAsync } = renderModal({}, {
      mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    fireEvent.change(screen.getByLabelText(/Board name/i), { target: { value: 'New Board' } });
    fireEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Network error');
    });
    expect(mutateAsync).toHaveBeenCalled();
  });

  it('clears form and signals close when cancel is pressed', () => {
    const onOpenChange = vi.fn();
    const { mutateAsync } = renderModal({ onOpenChange });

    const nameInput = screen.getByLabelText(/Board name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Draft Board' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(nameInput.value).toBe('');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('invokes onOpenChange when close button is pressed', () => {
    const onOpenChange = vi.fn();
    renderModal({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
