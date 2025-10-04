import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShowcaseBoard } from '@/components/ShowcaseBoard';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import * as showcaseBoardService from '@/services/showcaseBoard';

// Mock the service
vi.mock('@/services/showcaseBoard');

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

// Mock data
const mockShowcaseBoard: BoardWithImages = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  owner_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Showcase Board',
  description: 'A showcase board for the homepage',
  share_token: '123e4567-e89b-12d3-a456-426614174002',
  cover_rotation_enabled: true,
  is_showcase: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  images: [
    {
      id: 'img-1',
      board_id: '123e4567-e89b-12d3-a456-426614174000',
      storage_path: 'boards/123/image1.jpg',
      position: 1,
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      size_bytes: 102400,
      original_filename: 'image1.jpg',
      source_url: null,
      caption: 'Image 1',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'img-2',
      board_id: '123e4567-e89b-12d3-a456-426614174000',
      storage_path: 'boards/123/image2.jpg',
      position: 2,
      mime_type: 'image/jpeg',
      width: 600,
      height: 800,
      size_bytes: 153600,
      original_filename: 'image2.jpg',
      source_url: null,
      caption: 'Image 2',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'img-3',
      board_id: '123e4567-e89b-12d3-a456-426614174000',
      storage_path: 'boards/123/image3.jpg',
      position: 3,
      mime_type: 'image/jpeg',
      width: 1200,
      height: 800,
      size_bytes: 204800,
      original_filename: 'image3.jpg',
      source_url: null,
      caption: null,
      created_at: '2025-01-01T00:00:00Z',
    },
  ],
};

// Helper function to render with QueryClient
function renderShowcaseBoard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ShowcaseBoard />
    </QueryClientProvider>,
  );
}

describe('ShowcaseBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching showcase board', () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderShowcaseBoard();

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders showcase board images in 3-column layout', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    const { container } = renderShowcaseBoard();

    await waitFor(() => {
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(3);
    });

    // Verify images are distributed across 3 columns
    const columns = container.querySelectorAll('.showcase-column-1, .showcase-column-2, .showcase-column-3');
    expect(columns.length).toBe(3);
  });

  it('displays images with correct alt text', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    const { container } = renderShowcaseBoard();

    await waitFor(() => {
      const images = container.querySelectorAll('img');
      expect(images[0]).toHaveAttribute('alt', 'Image 1');
      expect(images[1]).toHaveAttribute('alt', 'Image 2');
      expect(images[2]).toHaveAttribute('alt', ''); // null caption becomes empty string
    });
  });

  it('applies lazy loading to images', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    const { container } = renderShowcaseBoard();

    await waitFor(() => {
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  it('preserves aspect ratio for images', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    const { container } = renderShowcaseBoard();

    await waitFor(() => {
      const imageWrappers = container.querySelectorAll('.overflow-hidden');
      // First image: 800/600 = 1.333...
      expect(imageWrappers[0]).toHaveStyle({ aspectRatio: '1.3333333333333333' });
      // Second image: 600/800 = 0.75
      expect(imageWrappers[1]).toHaveStyle({ aspectRatio: '0.75' });
    });
  });

  it('applies animation classes to columns', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    const { container } = renderShowcaseBoard();

    await waitFor(() => {
      const column1 = container.querySelector('.showcase-column-1');
      const column2 = container.querySelector('.showcase-column-2');
      const column3 = container.querySelector('.showcase-column-3');

      expect(column1).toBeInTheDocument();
      expect(column2).toBeInTheDocument();
      expect(column3).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockRejectedValue(
      new Error('Failed to fetch showcase board'),
    );

    renderShowcaseBoard();

    await waitFor(
      () => {
        expect(screen.getByText('Unable to load showcase')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('shows error message when board is null', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(null as any);

    renderShowcaseBoard();

    await waitFor(() => {
      expect(screen.getByText('Unable to load showcase')).toBeInTheDocument();
    });
  });

  it('sets up IntersectionObserver for visibility detection', () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    renderShowcaseBoard();

    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('distributes images across columns in round-robin fashion', async () => {
    vi.mocked(showcaseBoardService.getShowcaseBoard).mockResolvedValue(mockShowcaseBoard);

    const { container } = renderShowcaseBoard();

    await waitFor(() => {
      const column1 = container.querySelector('.showcase-column-1');
      const column2 = container.querySelector('.showcase-column-2');
      const column3 = container.querySelector('.showcase-column-3');

      // With 3 images, each column should have 1 image
      expect(column1?.querySelectorAll('img').length).toBe(1);
      expect(column2?.querySelectorAll('img').length).toBe(1);
      expect(column3?.querySelectorAll('img').length).toBe(1);
    });
  });
});
