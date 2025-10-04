import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import PublicBoard from '@/pages/PublicBoard';
import { type PublicBoardResponse } from '@/schemas/publicBoard';
import * as publicBoardsService from '@/services/publicBoards';

// Mock Header to avoid AuthProvider dependency
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

// Mock services
vi.mock('@/services/publicBoards');

const mockPublicBoardResponse: PublicBoardResponse = {
  board: {
    id: 'board-123',
    owner_id: 'user-123',
    name: 'Public Test Board',
    description: 'A beautiful public board',
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
    ],
  },
  owner: {
    id: 'user-123',
    display_name: 'Test User',
    avatar_url: null,
  },
};

function renderPublicBoard(shareToken: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/b/${shareToken}`]}>
          <Routes>
            <Route path="/b/:shareToken" element={<PublicBoard />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('PublicBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render public board with images', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(mockPublicBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByText('Public Test Board')).toBeInTheDocument();
    });

    expect(screen.getByText('A beautiful public board')).toBeInTheDocument();
    expect(screen.getByText('Shared by')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('2 images')).toBeInTheDocument();
  });

  it('should show 404 when board not found', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockRejectedValue(
      new Error('Board not found'),
    );

    renderPublicBoard('invalid-token');

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
    });

    expect(screen.getByText('Board not found')).toBeInTheDocument();
    expect(
      screen.getByText('This board may have been deleted or the link is invalid.'),
    ).toBeInTheDocument();
  });

  it('should display owner avatar when available', async () => {
    const responseWithAvatar: PublicBoardResponse = {
      ...mockPublicBoardResponse,
      owner: {
        ...mockPublicBoardResponse.owner,
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };

    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(responseWithAvatar);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      const avatar = screen.getByRole('img', { name: 'Test User' });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  it('should display owner initials when no avatar', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(mockPublicBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test User"
    });
  });

  it('should show copy link button', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(mockPublicBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });
  });

  it('should render images in read-only mode', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(mockPublicBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByText('Public Test Board')).toBeInTheDocument();
    });

    // Images should be rendered
    const images = screen.getAllByRole('img');
    // Should have owner avatar/initial + 2 images
    expect(images.length).toBeGreaterThanOrEqual(2);
  });

  it('should display empty state when board has no images', async () => {
    const emptyBoardResponse: PublicBoardResponse = {
      ...mockPublicBoardResponse,
      board: {
        ...mockPublicBoardResponse.board,
        images: [],
      },
    };

    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(emptyBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByText('No images yet')).toBeInTheDocument();
    });

    expect(screen.getByText('This board is empty')).toBeInTheDocument();
  });

  it('should set noindex meta tag', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(mockPublicBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByText('Public Test Board')).toBeInTheDocument();
    });

    // Helmet updates meta tags asynchronously, so we need to wait
    await waitFor(() => {
      const metaTags = document.querySelectorAll('meta[name="robots"]');
      expect(metaTags.length).toBeGreaterThan(0);
    });

    const metaTags = document.querySelectorAll('meta[name="robots"]');
    expect(metaTags[0].getAttribute('content')).toBe('noindex, nofollow');
  });

  it('should set Open Graph meta tags', async () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockResolvedValue(mockPublicBoardResponse);

    renderPublicBoard('share-token-123');

    await waitFor(() => {
      expect(screen.getByText('Public Test Board')).toBeInTheDocument();
    });

    // Wait for helmet to update OG tags
    await waitFor(() => {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle).toBeTruthy();
    });

    // Check OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe('Public Test Board');

    const ogDescription = document.querySelector('meta[property="og:description"]');
    expect(ogDescription?.getAttribute('content')).toBe('A beautiful public board');
  });

  it('should show loading spinner while fetching', () => {
    vi.mocked(publicBoardsService.getPublicBoard).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderPublicBoard('share-token-123');

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
