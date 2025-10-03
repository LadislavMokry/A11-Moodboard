import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageGrid } from '@/components/ImageGrid';
import { type Image } from '@/schemas/image';

const mockImages: Image[] = [
  {
    id: '1',
    board_id: '123e4567-e89b-12d3-a456-426614174000',
    storage_path: 'boards/123/image1.jpg',
    caption: 'First Image',
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
    caption: 'Second Image',
    position: 2,
    width: 1920,
    height: 1080,
    mime_type: 'image/jpeg',
    size_bytes: 1024000,
    original_filename: 'image2.jpg',
    source_url: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    board_id: '123e4567-e89b-12d3-a456-426614174000',
    storage_path: 'boards/123/image3.jpg',
    caption: 'Third Image',
    position: 3,
    width: 1920,
    height: 1080,
    mime_type: 'image/jpeg',
    size_bytes: 1024000,
    original_filename: 'image3.jpg',
    source_url: null,
    created_at: '2025-01-01T00:00:00Z',
  },
];

describe('ImageGrid', () => {
  it('renders all images in correct order', () => {
    const { container } = render(<ImageGrid images={mockImages} />);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('alt', 'First Image');
    expect(images[1]).toHaveAttribute('alt', 'Second Image');
    expect(images[2]).toHaveAttribute('alt', 'Third Image');
  });

  it('sorts images by position', () => {
    // Pass images in wrong order
    const unsortedImages = [mockImages[2], mockImages[0], mockImages[1]];
    const { container } = render(<ImageGrid images={unsortedImages} />);

    const images = container.querySelectorAll('img');
    expect(images[0]).toHaveAttribute('alt', 'First Image');
    expect(images[1]).toHaveAttribute('alt', 'Second Image');
    expect(images[2]).toHaveAttribute('alt', 'Third Image');
  });

  it('shows empty state when no images', () => {
    render(<ImageGrid images={[]} />);

    expect(screen.getByText('No images yet')).toBeInTheDocument();
    expect(screen.getByText('Upload images to get started')).toBeInTheDocument();
  });

  it('calls onImageClick when image is clicked', () => {
    const onImageClick = vi.fn();
    const { container } = render(<ImageGrid images={mockImages} onImageClick={onImageClick} />);

    const firstImage = container.querySelectorAll('img')[0];
    firstImage.closest('div')?.click();

    expect(onImageClick).toHaveBeenCalledWith(mockImages[0]);
  });

  it('calls onImageMenuClick when menu button is clicked', () => {
    const onImageMenuClick = vi.fn();
    const { container } = render(<ImageGrid images={mockImages} onImageMenuClick={onImageMenuClick} />);

    const menuButton = container.querySelectorAll('button[aria-label="Image options"]')[0];
    menuButton.click();

    expect(onImageMenuClick).toHaveBeenCalledWith(mockImages[0], expect.any(Object));
  });

  it('renders masonry grid with Tailwind column classes', () => {
    const { container } = render(<ImageGrid images={mockImages} />);

    const grid = container.querySelector('.columns-1');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('columns-1', 'sm:columns-2', 'lg:columns-3', 'gap-4');
  });

  it('renders images with lazy loading', () => {
    const { container } = render(<ImageGrid images={mockImages} />);

    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  it('handles empty captions correctly', () => {
    const imageWithoutCaption: Image = {
      ...mockImages[0],
      caption: null,
    };

    const { container } = render(<ImageGrid images={[imageWithoutCaption]} />);

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
  });
});
