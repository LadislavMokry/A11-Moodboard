import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TransferImagesDialog } from '@/components/TransferImagesDialog';
import * as boardsService from '@/services/boards';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Board } from '@/schemas/board';

// Mock dependencies
vi.mock('@/services/boards');
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const mockBoards: Board[] = [
  {
    id: 'board-1',
    owner_id: 'user-1',
    name: 'Board One',
    description: 'First board',
    share_token: 'token-1',
    cover_rotation_enabled: true,
    is_showcase: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'board-2',
    owner_id: 'user-1',
    name: 'Board Two',
    description: null,
    share_token: 'token-2',
    cover_rotation_enabled: true,
    is_showcase: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'source-board',
    owner_id: 'user-1',
    name: 'Source Board',
    description: 'The source',
    share_token: 'token-source',
    cover_rotation_enabled: true,
    is_showcase: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

function renderDialog(props: {
  open?: boolean;
  imageIds?: string[];
  sourceBoardId?: string;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const onOpenChange = vi.fn();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TransferImagesDialog
            open={props.open ?? true}
            onOpenChange={onOpenChange}
            imageIds={props.imageIds ?? ['img-1', 'img-2']}
            sourceBoardId={props.sourceBoardId ?? 'source-board'}
          />
        </MemoryRouter>
      </QueryClientProvider>
    ),
    onOpenChange,
  };
}

describe('TransferImagesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      loading: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    } as any);

    vi.mocked(boardsService.getBoards).mockResolvedValue(mockBoards);
  });

  it('renders dialog with correct title and image count', async () => {
    renderDialog({ imageIds: ['img-1', 'img-2', 'img-3'] });

    expect(screen.getByText('Transfer images')).toBeInTheDocument();
    expect(screen.getByText('3 images selected')).toBeInTheDocument();
  });

  it('shows singular "image" for single image', async () => {
    renderDialog({ imageIds: ['img-1'] });

    expect(screen.getByText('1 image selected')).toBeInTheDocument();
  });

  it('shows Copy and Move radio buttons with Copy selected by default', () => {
    renderDialog({});

    const copyRadio = screen.getByRole('radio', { name: /copy/i });
    const moveRadio = screen.getByRole('radio', { name: /move/i });

    expect(copyRadio).toBeChecked();
    expect(moveRadio).not.toBeChecked();
  });

  it('allows switching between Copy and Move operations', () => {
    renderDialog({});

    const moveRadio = screen.getByRole('radio', { name: /move/i });
    fireEvent.click(moveRadio);

    expect(moveRadio).toBeChecked();
  });

  it('displays search input for filtering boards', () => {
    renderDialog({});

    const searchInput = screen.getByPlaceholderText('Search boards...');
    expect(searchInput).toBeInTheDocument();
  });

  it('loads and displays available boards (excluding source board)', async () => {
    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
      expect(screen.getByText('Board Two')).toBeInTheDocument();
    });

    // Source board should not be displayed
    expect(screen.queryByText('Source Board')).not.toBeInTheDocument();
  });

  it('filters boards based on search query', async () => {
    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search boards...');
    fireEvent.change(searchInput, { target: { value: 'Two' } });

    expect(screen.queryByText('Board One')).not.toBeInTheDocument();
    expect(screen.getByText('Board Two')).toBeInTheDocument();
  });

  it('shows "No boards found" when search has no results', async () => {
    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search boards...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No boards found')).toBeInTheDocument();
  });

  it('shows "Create new board" option', () => {
    renderDialog({});

    expect(screen.getByText('Create new board')).toBeInTheDocument();
  });

  it('shows create board form when "Create new board" is clicked', () => {
    renderDialog({});

    const createButton = screen.getByText('Create new board');
    fireEvent.click(createButton);

    expect(screen.getByLabelText('New board name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create & transfer/i })).toBeInTheDocument();
  });

  it('allows canceling create board form', () => {
    renderDialog({});

    fireEvent.click(screen.getByText('Create new board'));
    expect(screen.getByLabelText('New board name')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByLabelText('New board name')).not.toBeInTheDocument();
    expect(screen.getByText('Create new board')).toBeInTheDocument();
  });

  it('disables transfer button when no board is selected', async () => {
    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
    });

    const transferButton = screen.getByRole('button', { name: /copy images/i });
    expect(transferButton).toBeDisabled();
  });

  it('enables transfer button when a board is selected', async () => {
    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Board One'));

    const transferButton = screen.getByRole('button', { name: /copy images/i });
    expect(transferButton).not.toBeDisabled();
  });

  it('changes transfer button text based on operation', async () => {
    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Board One'));

    expect(screen.getByRole('button', { name: /copy images/i })).toBeInTheDocument();

    const moveRadio = screen.getByRole('radio', { name: /move/i });
    fireEvent.click(moveRadio);

    expect(screen.getByRole('button', { name: /move images/i })).toBeInTheDocument();
  });

  it('calls transfer function when transfer button is clicked', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, transferredCount: 2 },
      error: null,
    });

    renderDialog({});

    await waitFor(() => {
      expect(screen.getByText('Board One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Board One'));

    const transferButton = screen.getByRole('button', { name: /copy images/i });
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('transfer_images', {
        body: {
          operation: 'copy',
          sourceBoardId: 'source-board',
          destBoardId: 'board-1',
          imageIds: ['img-1', 'img-2'],
        },
      });
    });
  });

  it('shows loading spinner while boards are loading', () => {
    vi.mocked(boardsService.getBoards).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderDialog({});

    // Check for loading spinner (assuming it has an aria-label or specific class)
    const loadingSpinner = screen.getByRole('status', { hidden: true });
    expect(loadingSpinner).toBeInTheDocument();
  });
});
