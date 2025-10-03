import { describe, it, expect, vi, beforeEach } from 'vitest';
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
];

describe('Lightbox Zoom & Pan', () => {
  const mockOnClose = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnNext.mockClear();
    mockOnPrev.mockClear();
  });

  it('displays zoom controls', () => {
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

    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByText('1.0x')).toBeInTheDocument();
  });

  it('zooms in when zoom in button is clicked', () => {
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

    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    expect(screen.getByText('1.5x')).toBeInTheDocument();
  });

  it('zooms out when zoom out button is clicked', () => {
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

    // Zoom in first
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);
    expect(screen.getByText('1.5x')).toBeInTheDocument();

    // Then zoom out
    const zoomOutButton = screen.getByLabelText('Zoom out');
    fireEvent.click(zoomOutButton);
    expect(screen.getByText('1.0x')).toBeInTheDocument();
  });

  it('disables zoom out button when at minimum zoom', () => {
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

    const zoomOutButton = screen.getByLabelText('Zoom out');
    expect(zoomOutButton).toBeDisabled();
  });

  it('disables zoom in button when at maximum zoom', () => {
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

    const zoomInButton = screen.getByLabelText('Zoom in');

    // Zoom in to maximum (1.0 -> 5.0, step 0.5 = 8 clicks)
    for (let i = 0; i < 8; i++) {
      fireEvent.click(zoomInButton);
    }

    expect(screen.getByText('5.0x')).toBeInTheDocument();
    expect(zoomInButton).toBeDisabled();
  });

  it('shows reset button when zoomed in', () => {
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

    // Reset button should not be visible at 1x zoom
    expect(screen.queryByLabelText('Reset zoom')).not.toBeInTheDocument();

    // Zoom in
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    // Reset button should now be visible
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
  });

  it('resets zoom when reset button is clicked', () => {
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

    // Zoom in
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomInButton);
    expect(screen.getByText('2.0x')).toBeInTheDocument();

    // Reset zoom
    const resetButton = screen.getByLabelText('Reset zoom');
    fireEvent.click(resetButton);

    expect(screen.getByText('1.0x')).toBeInTheDocument();
    expect(screen.queryByLabelText('Reset zoom')).not.toBeInTheDocument();
  });

  it('hides navigation buttons when zoomed in', () => {
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

    // Navigation buttons should be visible at 1x zoom
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();

    // Zoom in
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    // Navigation buttons should be hidden when zoomed
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
  });

  it('resets zoom when navigating to next image', () => {
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

    // Zoom in
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);
    expect(screen.getByText('1.5x')).toBeInTheDocument();

    // Navigate to next image
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

    // Zoom should be reset
    expect(screen.getByText('1.0x')).toBeInTheDocument();
  });

  it('prevents close on background click when zoomed', () => {
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

    // Zoom in
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    // Try to close by clicking background
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    // Should not close when zoomed
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('allows close on background click when not zoomed', () => {
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

    // Click background at 1x zoom
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    // Should close when not zoomed
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
