import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Lightbox } from '@/components/Lightbox';
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

describe('Lightbox', () => {
  const mockOnClose = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnNext.mockClear();
    mockOnPrev.mockClear();
  });

  it('renders with current image', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const img = screen.getByAltText('First Image');
    expect(img).toBeInTheDocument();
  });

  it('displays image counter', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('displays close button', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const closeButton = screen.getByLabelText('Close lightbox');
    expect(closeButton).toBeInTheDocument();
  });

    it('calls onClose when the background overlay is clicked and not zoomed', async () => {
      const onClose = vi.fn();
      render(<Lightbox images={mockImages} initialIndex={0} onClose={onClose} currentIndex={0} onNext={vi.fn()} onPrev={vi.fn()} />);

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onNext when next button is clicked', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrev when previous button is clicked', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={1}
        currentIndex={1}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);

    expect(mockOnPrev).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when background is clicked', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking on image', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const imgs = screen.getAllByAltText('First Image');
    const mainImg = imgs.find((img) => img.className.includes('select-none'));
    if (mainImg) {
      fireEvent.click(mainImg);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Image viewer');
  });

  it('displays navigation buttons for multiple images', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
  });

  it('hides navigation buttons for single image', () => {
    const singleImage = [mockImages[0]];

    render(
      <Lightbox
        images={singleImage}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
  });

  it('updates displayed image when currentIndex changes', () => {
    const { rerender } = render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const imgs = screen.getAllByAltText('First Image');
    expect(imgs.length).toBeGreaterThanOrEqual(1);

    rerender(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={1}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    const imgs2 = screen.getAllByAltText('Second Image');
    expect(imgs2.length).toBeGreaterThanOrEqual(1);
  });

  it('updates counter when currentIndex changes', () => {
    const { rerender } = render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    rerender(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={2}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hideThumbnails
      />,
    );

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});
