import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardPage from '@/pages/BoardPage';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import { type Image } from '@/schemas/image';
import * as boardsService from '@/services/boards';
import * as imagesService from '@/services/images';
import { useAuth } from '@/hooks/useAuth';

// Mock Header to avoid AuthProvider dependency
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

// Mock services
vi.mock('@/services/boards');
vi.mock('@/services/images');

// Mock useAuth
vi.mock('@/hooks/useAuth');

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockBoard: BoardWithImages = {
  id: 'board-123',
  owner_id: 'user-123',
  name: 'Test Board',
  description: 'Test Description',
  share_token: 'share-token-123',
  cover_rotation_enabled: true,
  is_showcase: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  images: [
    {
      id: 'image-1',
      board_id: 'board-123',
      storage_path: 'boards/board-123/image-1.jpg',
      position: 1,
      mime_type: 'image/jpeg',
      width: 1000,
      height: 1000,
      size_bytes: 50000,
      original_filename: 'image-1.jpg',
      source_url: null,
      caption: 'Image 1',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'image-2',
      board_id: 'board-123',
      storage_path: 'boards/board-123/image-2.jpg',
      position: 2,
      mime_type: 'image/jpeg',
      width: 1000,
      height: 1000,
      size_bytes: 50000,
      original_filename: 'image-2.jpg',
      source_url: null,
      caption: 'Image 2',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'image-3',
      board_id: 'board-123',
      storage_path: 'boards/board-123/image-3.jpg',
      position: 3,
      mime_type: 'image/jpeg',
      width: 1000,
      height: 1000,
      size_bytes: 50000,
      original_filename: 'image-3.jpg',
      source_url: null,
      caption: 'Image 3',
      created_at: '2025-01-01T00:00:00Z',
    },
  ] as Image[],
};

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
    </QueryClientProvider>,
  );
}

describe('BulkSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    });
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);
  });

  it('should enter selection mode when Select button is clicked', async () => {
    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    // Should show Cancel button instead
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^select$/i })).not.toBeInTheDocument();
  });

  it('should exit selection mode when Cancel button is clicked', async () => {
    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    // Exit selection mode
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Should show Select button again
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
  });

  it('should show selection toolbar when images are selected', async () => {
    const { container } = renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    // Find and click a checkbox (they should be visible in selection mode)
    const checkboxes = container.querySelectorAll('button[aria-label*="Select image"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[0]);

    // Should show selection toolbar
    await waitFor(() => {
      expect(screen.getByText('1 image selected')).toBeInTheDocument();
    });
  });

  it('should update selection count when multiple images are selected', async () => {
    const { container } = renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    // Select multiple images
    const checkboxes = container.querySelectorAll('button[aria-label*="Select image"]');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    // Should show correct count
    await waitFor(() => {
      expect(screen.getByText('3 images selected')).toBeInTheDocument();
    });
  });

  it('should deselect all when Deselect all button is clicked', async () => {
    const { container } = renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode and select images
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    const checkboxes = container.querySelectorAll('button[aria-label*="Select image"]');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('2 images selected')).toBeInTheDocument();
    });

    // Click Deselect all
    const deselectAllButton = screen.getByRole('button', { name: /deselect all/i });
    fireEvent.click(deselectAllButton);

    // Toolbar should disappear
    await waitFor(() => {
      expect(screen.queryByText(/images selected/)).not.toBeInTheDocument();
    });
  });

  it('should show bulk delete dialog when Delete button is clicked', async () => {
    const { container } = renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode and select images
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    const checkboxes = container.querySelectorAll('button[aria-label*="Select image"]');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('2 images selected')).toBeInTheDocument();
    });

    // Click Delete in toolbar
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Should show bulk delete dialog
    await waitFor(() => {
      expect(screen.getByText(/delete 2 images/i)).toBeInTheDocument();
    });
  });

  it('should hide three-dot menu in selection mode', async () => {
    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Three-dot menu should be present initially (though hidden)
    // We can't easily test visibility without complex hover simulation

    // Enter selection mode
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    // In selection mode, the three-dot menu should not be rendered at all
    const menuButtons = screen.queryAllByLabelText('Image options');
    expect(menuButtons).toHaveLength(0);
  });

  it('should toggle image selection when checkbox is clicked', async () => {
    const { container } = renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    const checkbox = container.querySelector('button[aria-label="Select image"]');
    expect(checkbox).toBeInTheDocument();

    // Click to select
    fireEvent.click(checkbox!);

    await waitFor(() => {
      expect(screen.getByText('1 image selected')).toBeInTheDocument();
    });

    // Click again to deselect
    const deselectCheckbox = container.querySelector('button[aria-label="Deselect image"]');
    fireEvent.click(deselectCheckbox!);

    await waitFor(() => {
      expect(screen.queryByText(/images selected/)).not.toBeInTheDocument();
    });
  });

  it('should exit selection mode after bulk delete', async () => {
    vi.mocked(imagesService.deleteImage).mockResolvedValue();

    const { container } = renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Enter selection mode and select an image
    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    const checkboxes = container.querySelectorAll('button[aria-label*="Select image"]');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(screen.getByText('1 image selected')).toBeInTheDocument();
    });

    // Open bulk delete dialog
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText(/delete 1 image/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /delete image/i });
    fireEvent.click(confirmButton);

    // Should exit selection mode after successful delete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    });
  });
});
