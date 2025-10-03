import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CustomDragOverlay } from '@/components/CustomDragOverlay';
import { type Image } from '@/schemas/image';

const mockImage: Image = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  board_id: '123e4567-e89b-12d3-a456-426614174001',
  storage_path: 'boards/test-board/test-image.jpg',
  position: 1,
  mime_type: 'image/jpeg',
  width: 1200,
  height: 800,
  size_bytes: 500000,
  original_filename: 'test-image.jpg',
  source_url: null,
  caption: 'Test Caption',
  created_at: '2025-01-01T00:00:00Z',
};

describe('CustomDragOverlay', () => {
  it('renders image with proper styling', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test Caption');
    expect(img).toHaveAttribute('src');
  });

  it('applies scale and rotation transform', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveStyle({
      transform: 'scale(1.05) rotate(2deg)',
    });
  });

  it('applies shadow for depth', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveStyle({
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    });
  });

  it('displays caption when present', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    expect(container.textContent).toContain('Test Caption');
  });

  it('does not display caption overlay when caption is null', () => {
    const imageWithoutCaption = { ...mockImage, caption: null };
    const { container } = render(<CustomDragOverlay image={imageWithoutCaption} />);

    const captionOverlay = container.querySelector('.absolute.bottom-0');
    expect(captionOverlay).not.toBeInTheDocument();
  });

  it('renders GIF with full URL instead of thumbnail', () => {
    const gifImage = { ...mockImage, mime_type: 'image/gif' };
    const { container } = render(<CustomDragOverlay image={gifImage} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src');
    expect(img).not.toHaveAttribute('srcSet');
  });

  it('renders non-GIF with srcSet for responsive loading', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('srcSet');
  });

  it('preserves aspect ratio', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toHaveStyle({
      aspectRatio: '1200 / 800',
    });
  });

  it('has white outline for visibility', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const outline = container.querySelector('div[class*="absolute inset-0"]');
    expect(outline).toBeInTheDocument();
    expect(outline).toHaveStyle({
      boxShadow: 'inset 0 0 0 2px white',
    });
  });

  it('is pointer-events-none for proper overlay behavior', () => {
    const { container } = render(<CustomDragOverlay image={mockImage} />);

    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveClass('pointer-events-none');
  });
});
