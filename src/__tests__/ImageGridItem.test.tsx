import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGridItem } from '@/components/ImageGridItem';
import { type Image } from '@/schemas/image';

const mockImage: Image = {
  id: '1',
  board_id: '123e4567-e89b-12d3-a456-426614174000',
  storage_path: 'boards/123/image1.jpg',
  caption: 'Test Caption',
  position: 1,
  width: 1920,
  height: 1080,
  mime_type: 'image/jpeg',
  size_bytes: 1024000,
  original_filename: 'image1.jpg',
  source_url: null,
  created_at: '2025-01-01T00:00:00Z',
};

const mockGifImage: Image = {
  ...mockImage,
  id: '2',
  storage_path: 'boards/123/animation.gif',
  mime_type: 'image/gif',
  original_filename: 'animation.gif',
};

describe('ImageGridItem', () => {
  it('renders image with proper attributes', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test Caption');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders image with caption as alt text', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Test Caption');
  });

  it('renders image with empty alt text when no caption', () => {
    const imageWithoutCaption = { ...mockImage, caption: null };
    const { container } = render(<ImageGridItem image={imageWithoutCaption} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
  });

  it('renders image with responsive srcset', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('srcset');
    expect(img?.getAttribute('srcset')).toContain('360w');
    expect(img?.getAttribute('srcset')).toContain('720w');
    expect(img?.getAttribute('srcset')).toContain('1080w');
  });

  it('renders GIF without srcset (uses full URL)', () => {
    const { container } = render(<ImageGridItem image={mockGifImage} />);

    const img = container.querySelector('img');
    expect(img).not.toHaveAttribute('srcset');
    expect(img).not.toHaveAttribute('sizes');
  });

  it('renders image with correct aspect ratio', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const img = container.querySelector('img');
    expect(img).toHaveStyle({ aspectRatio: '1920 / 1080' });
  });

  it('shows menu button with aria-label', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const menuButton = container.querySelector('button[aria-label="Image options"]');
    expect(menuButton).toBeInTheDocument();
  });

  it('calls onClick when image is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<ImageGridItem image={mockImage} onClick={onClick} />);

    const imageWrapper = container.querySelector('.group');
    fireEvent.click(imageWrapper!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onMenuClick when menu button is clicked', () => {
    const onMenuClick = vi.fn();
    const { container } = render(<ImageGridItem image={mockImage} onMenuClick={onMenuClick} />);

    const menuButton = container.querySelector('button[aria-label="Image options"]');
    fireEvent.click(menuButton!);

    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onMenuClick).toHaveBeenCalledWith(expect.any(Object));
  });

  it('stops propagation when menu button is clicked', () => {
    const onClick = vi.fn();
    const onMenuClick = vi.fn();
    const { container } = render(<ImageGridItem image={mockImage} onClick={onClick} onMenuClick={onMenuClick} />);

    const menuButton = container.querySelector('button[aria-label="Image options"]');
    fireEvent.click(menuButton!);

    // Menu click handler should be called, but not the image click handler
    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows caption overlay on hover', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const imageContainer = container.querySelector('.group');
    expect(imageContainer).toBeInTheDocument();

    // Caption text should be present in the DOM
    const caption = container.querySelector('.text-sm.text-white');
    expect(caption).toHaveTextContent('Test Caption');
  });

  it('does not show caption overlay when no caption exists', () => {
    const imageWithoutCaption = { ...mockImage, caption: null };
    const { container } = render(<ImageGridItem image={imageWithoutCaption} />);

    // Caption overlay should not be in the DOM
    const captionOverlay = container.querySelector('.bg-gradient-to-t');
    expect(captionOverlay).not.toBeInTheDocument();
  });

  it('shows white outline on hover (via box-shadow)', () => {
    const { container } = render(<ImageGridItem image={mockImage} />);

    const outline = container.querySelector('[style*="box-shadow"]');
    expect(outline).toBeInTheDocument();
  });

  it('handles images without dimensions gracefully', () => {
    const imageWithoutDimensions = {
      ...mockImage,
      width: null,
      height: null,
    };

    const { container } = render(<ImageGridItem image={imageWithoutDimensions} />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    // Should not set aspectRatio if dimensions are missing
    expect(img?.style.aspectRatio).toBeFalsy();
  });
});
