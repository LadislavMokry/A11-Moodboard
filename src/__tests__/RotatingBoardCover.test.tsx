import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RotatingBoardCover } from '@/components/RotatingBoardCover';
import { type Image } from '@/schemas/image';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock image utils
vi.mock('@/lib/imageUtils', () => ({
  getSupabaseThumbnail: (path: string, width: number) =>
    `https://example.com/${path}?w=${width}`,
}));

describe('RotatingBoardCover', () => {
  // Helper to create mock images
  const createMockImage = (id: string, position: number): Image => ({
    id,
    board_id: 'board-1',
    storage_path: `boards/board-1/image-${id}.jpg`,
    position,
    mime_type: 'image/jpeg',
    width: 1000,
    height: 1000,
    size_bytes: 50000,
    original_filename: `image-${id}.jpg`,
    source_url: null,
    caption: `Image ${id}`,
    created_at: new Date().toISOString(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders empty state when no images', () => {
    const { container } = render(
      <RotatingBoardCover
        images={[]}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    // Should render ImageIcon for empty state
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders static display for 4 or fewer images', () => {
    const images = [
      createMockImage('1', 1),
      createMockImage('2', 2),
      createMockImage('3', 3),
    ];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(4); // Always renders 4 tiles

    // First 3 should have actual images
    expect(imgs[0]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-1.jpg?w=360'
    );
    expect(imgs[1]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-2.jpg?w=360'
    );
    expect(imgs[2]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-3.jpg?w=360'
    );
  });

  it('renders 2x2 grid structure', () => {
    const images = [
      createMockImage('1', 1),
      createMockImage('2', 2),
      createMockImage('3', 3),
      createMockImage('4', 4),
    ];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    // Check grid container classes
    const gridContainer = container.querySelector('.grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('aspect-square');
  });

  it('rotates through images when more than 4', () => {
    const images = [
      createMockImage('1', 1),
      createMockImage('2', 2),
      createMockImage('3', 3),
      createMockImage('4', 4),
      createMockImage('5', 5),
      createMockImage('6', 6),
    ];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    // Initial state
    const initialImgs = container.querySelectorAll('img');
    expect(initialImgs).toHaveLength(4);

    // Advance timers to trigger rotation (2000ms per tile)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // After 2s, one tile should have rotated
    const afterRotationImgs = container.querySelectorAll('img');
    expect(afterRotationImgs).toHaveLength(4); // Still 4 tiles
  });

  it('pauses rotation when rotationEnabled is false', () => {
    const images = [
      createMockImage('1', 1),
      createMockImage('2', 2),
      createMockImage('3', 3),
      createMockImage('4', 4),
      createMockImage('5', 5),
    ];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={false}
      />
    );

    const initialImgs = container.querySelectorAll('img');
    const initialSrcs = Array.from(initialImgs).map((img) =>
      img.getAttribute('src')
    );

    // Advance timers - rotation should NOT happen
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    const afterImgs = container.querySelectorAll('img');
    const afterSrcs = Array.from(afterImgs).map((img) => img.getAttribute('src'));

    // Images should remain the same
    expect(afterSrcs).toEqual(initialSrcs);
  });

  it('uses correct alt text from caption or board name', () => {
    const images = [createMockImage('1', 1)];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Image 1'); // Uses caption
  });

  it('applies lazy loading to images', () => {
    const images = [createMockImage('1', 1)];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('handles custom cover image IDs', () => {
    const images = [
      createMockImage('1', 1),
      createMockImage('2', 2),
      createMockImage('3', 3),
      createMockImage('4', 4),
      createMockImage('5', 5),
    ];

    // Only use images 2 and 4 for cover
    const coverImageIds = ['2', '4'];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
        coverImageIds={coverImageIds}
      />
    );

    const imgs = container.querySelectorAll('img');

    // Should only use the specified cover images
    expect(imgs[0]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-2.jpg?w=360'
    );
    expect(imgs[1]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-4.jpg?w=360'
    );
  });

  it('fills empty tiles when fewer than 4 images', () => {
    const images = [createMockImage('1', 1), createMockImage('2', 2)];

    const { container } = render(
      <RotatingBoardCover
        images={images}
        boardName="Test Board"
        rotationEnabled={true}
      />
    );

    // Should render 4 tile divs
    const tiles = container.querySelectorAll('.aspect-square.overflow-hidden');
    expect(tiles).toHaveLength(4);

    // All 4 tiles should render img elements (with cycling for <4 images)
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(4);

    // First 2 images should be the actual images
    expect(imgs[0]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-1.jpg?w=360'
    );
    expect(imgs[1]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-2.jpg?w=360'
    );
    // Tiles 3 and 4 will cycle back to images 1 and 2
    expect(imgs[2]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-1.jpg?w=360'
    );
    expect(imgs[3]).toHaveAttribute(
      'src',
      'https://example.com/boards/board-1/image-2.jpg?w=360'
    );
  });
});
