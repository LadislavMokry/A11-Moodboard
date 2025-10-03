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
      />,
    );

    const closeButton = screen.getByLabelText('Close lightbox');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={0}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />,
    );

    const closeButton = screen.getByLabelText('Close lightbox');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
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
      />,
    );

    const img = screen.getByAltText('First Image');
    fireEvent.click(img);

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
      />,
    );

    expect(screen.getByAltText('First Image')).toBeInTheDocument();

    rerender(
      <Lightbox
        images={mockImages}
        initialIndex={0}
        currentIndex={1}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />,
    );

    expect(screen.getByAltText('Second Image')).toBeInTheDocument();
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
      />,
    );

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});
