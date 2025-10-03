import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LightboxThumbnailStrip } from '@/components/LightboxThumbnailStrip';
import { type Image } from '@/schemas/image';

const mockImages: Image[] = [
  {
    id: 'image-1',
    board_id: 'board-1',
    storage_path: 'boards/board-1/image-1.jpg',
    position: 1,
    mime_type: 'image/jpeg',
    width: 1200,
    height: 800,
    size_bytes: 500000,
    original_filename: 'image-1.jpg',
    source_url: null,
    caption: 'First Image',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'image-2',
    board_id: 'board-1',
    storage_path: 'boards/board-1/image-2.jpg',
    position: 2,
    mime_type: 'image/jpeg',
    width: 1200,
    height: 800,
    size_bytes: 500000,
    original_filename: 'image-2.jpg',
    source_url: null,
    caption: 'Second Image',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'image-3',
    board_id: 'board-1',
    storage_path: 'boards/board-1/image-3.jpg',
    position: 3,
    mime_type: 'image/jpeg',
    width: 1200,
    height: 800,
    size_bytes: 500000,
    original_filename: 'image-3.jpg',
    source_url: null,
    caption: 'Third Image',
    created_at: '2025-01-01T00:00:00Z',
  },
];

describe('LightboxThumbnailStrip', () => {
  const mockOnThumbnailClick = vi.fn();

  beforeEach(() => {
    mockOnThumbnailClick.mockClear();
  });

  it('renders all thumbnails', () => {
    render(
      <LightboxThumbnailStrip
        images={mockImages}
        currentIndex={0}
        onThumbnailClick={mockOnThumbnailClick}
      />,
    );

    const firstThumbnail = screen.getByLabelText('View First Image');
    const secondThumbnail = screen.getByLabelText('View Second Image');
    const thirdThumbnail = screen.getByLabelText('View Third Image');

    expect(firstThumbnail).toBeInTheDocument();
    expect(secondThumbnail).toBeInTheDocument();
    expect(thirdThumbnail).toBeInTheDocument();
  });

  it('highlights the current thumbnail', () => {
    const { rerender } = render(
      <LightboxThumbnailStrip
        images={mockImages}
        currentIndex={0}
        onThumbnailClick={mockOnThumbnailClick}
      />,
    );

    const firstThumbnail = screen.getByLabelText('View First Image');
    expect(firstThumbnail).toHaveClass('ring-2');

    // Change current index
    rerender(
      <LightboxThumbnailStrip
        images={mockImages}
        currentIndex={1}
        onThumbnailClick={mockOnThumbnailClick}
      />,
    );

    const secondThumbnail = screen.getByLabelText('View Second Image');
    expect(secondThumbnail).toHaveClass('ring-2');
  });

  it('calls onThumbnailClick when thumbnail is clicked', () => {
    render(
      <LightboxThumbnailStrip
        images={mockImages}
        currentIndex={0}
        onThumbnailClick={mockOnThumbnailClick}
      />,
    );

    const secondThumbnail = screen.getByLabelText('View Second Image');
    fireEvent.click(secondThumbnail);

    expect(mockOnThumbnailClick).toHaveBeenCalledWith(1);
  });

  it('is hidden on mobile (md breakpoint)', () => {
    const { container } = render(
      <LightboxThumbnailStrip
        images={mockImages}
        currentIndex={0}
        onThumbnailClick={mockOnThumbnailClick}
      />,
    );

    const strip = container.firstChild as HTMLElement;
    expect(strip).toHaveClass('hidden');
    expect(strip).toHaveClass('md:flex');
  });

  it('renders nothing when images array is empty', () => {
    const { container } = render(
      <LightboxThumbnailStrip images={[]} currentIndex={0} onThumbnailClick={mockOnThumbnailClick} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays correct number of thumbnails', () => {
    render(
      <LightboxThumbnailStrip
        images={mockImages}
        currentIndex={0}
        onThumbnailClick={mockOnThumbnailClick}
      />,
    );

    const thumbnails = screen.getAllByRole('button');
    expect(thumbnails).toHaveLength(3);
  });
});
