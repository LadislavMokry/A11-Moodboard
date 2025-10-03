import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardPage from '@/pages/BoardPage';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import * as boardsService from '@/services/boards';

// Mock Header component to avoid AuthProvider dependency
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

// Mock the boards service
vi.mock('@/services/boards');

// Mock Supabase to prevent initialization errors
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  },
}));

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
  images: [
    {
      id: '1',
      board_id: '123e4567-e89b-12d3-a456-426614174000',
      storage_path: 'boards/123/image1.jpg',
      caption: 'Test Image 1',
      position: 1,
      width: 1920,
      height: 1080,
      mime_type: 'image/jpeg',
      size_bytes: 1024000,
      original_filename: 'image1.jpg',
      source_url: null,
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      board_id: '123e4567-e89b-12d3-a456-426614174000',
      storage_path: 'boards/123/image2.jpg',
      caption: 'Test Image 2',
      position: 2,
      width: 1920,
      height: 1080,
      mime_type: 'image/jpeg',
      size_bytes: 1024000,
      original_filename: 'image2.jpg',
      source_url: null,
      created_at: '2025-01-01T00:00:00Z',
    },
  ],
};

const mockBoardEmpty: BoardWithImages = {
  ...mockBoard,
  id: '223e4567-e89b-12d3-a456-426614174000',
  name: 'Empty Board',
  description: 'Board with no images',
  images: [],
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

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching board', () => {
    vi.mocked(boardsService.getBoard).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderBoardPage(mockBoard.id);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error message when board fetch fails', async () => {
    vi.mocked(boardsService.getBoard).mockRejectedValue(
      new Error('Failed to fetch board'),
    );

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch board')).toBeInTheDocument();
    });
  });

  it('shows error message when board is not found', async () => {
    vi.mocked(boardsService.getBoard).mockRejectedValue(
      new Error('Board not found'),
    );

    renderBoardPage('non-existent-id');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Board not found')).toBeInTheDocument();
    });
  });

  it('renders board header with name and description', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
      expect(screen.getByText('A test board description')).toBeInTheDocument();
    });
  });

  it('renders board header with image count', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByText('2 images')).toBeInTheDocument();
    });
  });

  it('renders board header with action buttons', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });
  });

  it('renders image grid with images', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      const images = screen.getAllByRole('img', { name: /test image/i });
      expect(images).toHaveLength(2);
    });
  });

  it('renders empty state when board has no images', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoardEmpty);

    renderBoardPage(mockBoardEmpty.id);

    await waitFor(() => {
      expect(screen.getByText('No images yet')).toBeInTheDocument();
      expect(screen.getByText('Upload images to get started')).toBeInTheDocument();
    });
  });

  it('renders back button with correct link', async () => {
    vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      const backButton = screen.getByRole('link', { name: /back to boards/i });
      expect(backButton).toHaveAttribute('href', '/');
    });
  });

  it('fetches board with correct ID from route params', async () => {
    const getBoardSpy = vi.mocked(boardsService.getBoard).mockResolvedValue(mockBoard);

    renderBoardPage(mockBoard.id);

    await waitFor(() => {
      expect(getBoardSpy).toHaveBeenCalledWith(mockBoard.id);
    });
  });
});
