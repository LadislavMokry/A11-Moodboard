import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SaveStagedImagesModal } from '@/components/SaveStagedImagesModal';
import { useBoards } from '@/hooks/useBoards';
import { useCreateBoard } from '@/hooks/useBoardMutations';
import * as imagesService from '@/services/images';
import type { Board } from '@/schemas/board';

// Mock dependencies
vi.mock('@/hooks/useBoards');
vi.mock('@/hooks/useBoardMutations');
vi.mock('@/services/images');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseBoards = vi.mocked(useBoards);
const mockUseCreateBoard = vi.mocked(useCreateBoard);
const mockUploadImage = vi.mocked(imagesService.uploadImage);
const mockAddImageToBoard = vi.mocked(imagesService.addImageToBoard);

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
];

function renderModal(props: Partial<React.ComponentProps<typeof SaveStagedImagesModal>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    files: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })],
    onSuccess: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SaveStagedImagesModal {...defaultProps} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SaveStagedImagesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseBoards.mockReturnValue({
      data: mockBoards,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseCreateBoard.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    mockUploadImage.mockResolvedValue({
      storagePath: 'boards/board-1/test.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      originalFilename: 'test.jpg',
    });

    mockAddImageToBoard.mockResolvedValue({
      id: 'image-1',
      board_id: 'board-1',
      storage_path: 'boards/board-1/test.jpg',
      position: 1,
      mime_type: 'image/jpeg',
      width: 100,
      height: 100,
      size_bytes: 1024,
      original_filename: 'test.jpg',
      source_url: null,
      caption: null,
      created_at: '2025-01-01T00:00:00Z',
    });
  });

  it('renders with file count', () => {
    const files = [
      new File(['content'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['content'], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    renderModal({ files });

    expect(screen.getByText('Save 2 images')).toBeInTheDocument();
  });

  it('shows existing boards in select mode', () => {
    renderModal();

    expect(screen.getByText('Board One')).toBeInTheDocument();
    expect(screen.getByText('Board Two')).toBeInTheDocument();
  });

  it('allows selecting a board', async () => {
    renderModal();

    const board1 = screen.getByText('Board One');
    fireEvent.click(board1);

    await waitFor(() => {
      expect(board1.closest('button')).toHaveClass('bg-violet-500');
    });
  });

  it('filters boards by search query', async () => {
    renderModal();

    const searchInput = screen.getByPlaceholderText('Search boards...');
    fireEvent.change(searchInput, { target: { value: 'Two' } });

    await waitFor(() => {
      expect(screen.queryByText('Board One')).not.toBeInTheDocument();
      expect(screen.getByText('Board Two')).toBeInTheDocument();
    });
  });

  it('switches to create mode', async () => {
    renderModal();

    const createButton = screen.getByRole('button', { name: /new board/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Board name')).toBeInTheDocument();
    });
  });

  it('saves to existing board', async () => {
    const onSuccess = vi.fn();
    const navigate = vi.fn();
    vi.mock('react-router-dom', async () => ({
      ...(await vi.importActual('react-router-dom')),
      useNavigate: () => navigate,
    }));

    renderModal({ onSuccess });

    // Select board
    const board1 = screen.getByText('Board One');
    fireEvent.click(board1);

    // Click save
    const saveButton = screen.getByRole('button', { name: /save to board/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalled();
      expect(mockAddImageToBoard).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('creates new board and saves', async () => {
    const onSuccess = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue({
      id: 'new-board',
      name: 'My New Board',
    });

    mockUseCreateBoard.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderModal({ onSuccess });

    // Switch to create mode
    const createButton = screen.getByRole('button', { name: /new board/i });
    fireEvent.click(createButton);

    // Enter board name
    const nameInput = screen.getByLabelText('Board name');
    fireEvent.change(nameInput, { target: { value: 'My New Board' } });

    // Click create & save
    const saveButton = screen.getByRole('button', { name: /create & save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: 'My New Board',
        description: null,
      });
      expect(mockUploadImage).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows character count in create mode', async () => {
    renderModal();

    const createButton = screen.getByRole('button', { name: /new board/i });
    fireEvent.click(createButton);

    const nameInput = screen.getByLabelText('Board name');
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    expect(screen.getByText('4/60 characters')).toBeInTheDocument();
  });

  it('disables save when no board selected', () => {
    renderModal();

    const saveButton = screen.getByRole('button', { name: /save to board/i });
    expect(saveButton).toBeDisabled();
  });

  it('disables create when board name is empty', async () => {
    renderModal();

    const createButton = screen.getByRole('button', { name: /new board/i });
    fireEvent.click(createButton);

    const saveButton = screen.getByRole('button', { name: /create & save/i });
    expect(saveButton).toBeDisabled();
  });

  it('handles upload errors', async () => {
    mockUploadImage.mockRejectedValue(new Error('Upload failed'));

    renderModal();

    const board1 = screen.getByText('Board One');
    fireEvent.click(board1);

    const saveButton = screen.getByRole('button', { name: /save to board/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalled();
    });
  });

  it('shows no boards message when empty', () => {
    mockUseBoards.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderModal();

    expect(screen.getByText('No boards yet')).toBeInTheDocument();
  });

  it('resets selected board when switching to create mode', async () => {
    renderModal();

    // Select a board
    const board1 = screen.getByText('Board One');
    fireEvent.click(board1);

    await waitFor(() => {
      expect(board1.closest('button')).toHaveClass('bg-violet-500');
    });

    // Switch to create mode
    const createButton = screen.getByRole('button', { name: /new board/i });
    fireEvent.click(createButton);

    // Switch back to select mode
    const selectButton = screen.getByRole('button', { name: /existing board/i });
    fireEvent.click(selectButton);

    await waitFor(() => {
      // Save button should be disabled since selection was reset
      const saveButton = screen.getByRole('button', { name: /save to board/i });
      expect(saveButton).toBeDisabled();
    });
  });
});
