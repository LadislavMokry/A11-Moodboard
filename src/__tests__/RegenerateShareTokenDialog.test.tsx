import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegenerateShareTokenDialog } from '@/components/RegenerateShareTokenDialog';
import * as boardMutations from '@/hooks/useBoardMutations';
import * as clipboard from '@/lib/clipboard';
import { type Board } from '@/schemas/board';

// Mock clipboard module
vi.mock('@/lib/clipboard', () => ({
  copyToClipboard: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock board mutations
vi.mock('@/hooks/useBoardMutations', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useBoardMutations')>(
    '@/hooks/useBoardMutations',
  );
  return {
    ...actual,
    useRegenerateShareToken: vi.fn(),
  };
});

const mockBoard: Board = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  owner_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Board',
  description: 'A test board',
  share_token: '123e4567-e89b-12d3-a456-426614174002',
  cover_rotation_enabled: true,
  is_showcase: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
};

const mockNewShareToken = '987e6543-e21b-12d3-a456-426614174999';

function renderDialog(props?: Partial<React.ComponentProps<typeof RegenerateShareTokenDialog>>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const defaultProps: React.ComponentProps<typeof RegenerateShareTokenDialog> = {
    open: true,
    onOpenChange: vi.fn(),
    boardId: mockBoard.id,
    currentShareToken: mockBoard.share_token,
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <RegenerateShareTokenDialog {...defaultProps} />
    </QueryClientProvider>,
  );
}

describe('RegenerateShareTokenDialog', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(boardMutations.useRegenerateShareToken).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  it('should not render when open is false', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render confirmation state when open', () => {
    renderDialog();

    expect(screen.getByText('Regenerate share link')).toBeInTheDocument();
    expect(screen.getByText('This will invalidate the old share link')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This will invalidate the old share link. Anyone with the old link will lose access.',
      ),
    ).toBeInTheDocument();
  });

  it('should display current share URL', () => {
    renderDialog();

    expect(screen.getByText('Current share link')).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/b/${mockBoard.share_token}`),
    ).toBeInTheDocument();
  });

  it('should have Cancel and Generate New Link buttons in confirmation state', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate new link/i })).toBeInTheDocument();
  });

  it('should call onOpenChange when Cancel is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange when close button is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show loading state while regenerating', () => {
    vi.mocked(boardMutations.useRegenerateShareToken).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    renderDialog();

    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('should regenerate token and show success state on Generate New Link click', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(mockBoard.id);
    });

    await waitFor(() => {
      expect(screen.getByText('New link generated')).toBeInTheDocument();
      expect(screen.getByText('Your new share link is ready')).toBeInTheDocument();
    });
  });

  it('should display old URL with strikethrough and new URL after regeneration', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByText('Old share link (no longer valid)')).toBeInTheDocument();
    });

    // Old URL should be visible with strikethrough
    const oldUrl = screen.getByText(`${window.location.origin}/b/${mockBoard.share_token}`);
    expect(oldUrl).toHaveClass('line-through');

    // New URL should be visible
    expect(screen.getByText('New share link')).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/b/${mockNewShareToken}`),
    ).toBeInTheDocument();
  });

  it('should show Copy button for new link after regeneration', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  it('should copy new link to clipboard when Copy button is clicked', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });
    vi.mocked(clipboard.copyToClipboard).mockResolvedValue();

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(clipboard.copyToClipboard).toHaveBeenCalledWith(
        `${window.location.origin}/b/${mockNewShareToken}`,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('should show Done button in success state', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });
  });

  it('should call onOpenChange when Done button is clicked', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /done/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should handle regeneration errors gracefully', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Failed to regenerate share token'));

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Should remain in confirmation state (not show success state)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate new link/i })).toBeInTheDocument();
    });
  });

  it('should handle copy errors gracefully', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });
    vi.mocked(clipboard.copyToClipboard).mockRejectedValue(new Error('Copy failed'));

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(clipboard.copyToClipboard).toHaveBeenCalled();
    });
  });

  it('should reset state when dialog is reopened', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });

    const { rerender } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByText('New link generated')).toBeInTheDocument();
    });

    // Close dialog
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <RegenerateShareTokenDialog
          open={false}
          onOpenChange={vi.fn()}
          boardId={mockBoard.id}
          currentShareToken={mockBoard.share_token}
        />
      </QueryClientProvider>,
    );

    // Reopen dialog
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <RegenerateShareTokenDialog
          open={true}
          onOpenChange={vi.fn()}
          boardId={mockBoard.id}
          currentShareToken={mockBoard.share_token}
        />
      </QueryClientProvider>,
    );

    // Should be back in confirmation state
    expect(screen.getByText('Regenerate share link')).toBeInTheDocument();
    expect(screen.getByText('This will invalidate the old share link')).toBeInTheDocument();
  });

  it('should show warning icon in confirmation state', () => {
    renderDialog();

    // Check for AlertTriangle icon container
    const iconContainer = document.querySelector('.bg-amber-100');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should highlight new URL with violet styling', async () => {
    mockMutateAsync.mockResolvedValue({
      ...mockBoard,
      share_token: mockNewShareToken,
    });

    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /generate new link/i }));

    await waitFor(() => {
      expect(screen.getByText('New share link')).toBeInTheDocument();
    });

    // New URL container should have violet styling
    const newUrlContainer = screen
      .getByText(`${window.location.origin}/b/${mockNewShareToken}`)
      .closest('div');
    expect(newUrlContainer).toHaveClass('bg-violet-50');
  });
});
