import { useEffect, useRef, useState, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import { type Image } from '@/schemas/image';
import { MagnifiableThumbnail } from '@/components/MagnifiableThumbnail';

interface LightboxThumbnailStripProps {
  images: Image[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
}

const MAX_THUMBNAILS = 7;
const THUMBNAIL_SIZE = 80; // pixels
const MAX_SCALE = 1.5;

export function LightboxThumbnailStrip({
  images,
  currentIndex,
  onThumbnailClick,
}: LightboxThumbnailStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Select which images to display (max 7, centered around current)
  const visibleImages = useMemo(() => {
    if (images.length <= MAX_THUMBNAILS) {
      return images.map((img, idx) => ({ image: img, originalIndex: idx }));
    }

    // Calculate range around current index
    const halfWindow = Math.floor(MAX_THUMBNAILS / 2);
    let start = Math.max(0, currentIndex - halfWindow);
    let end = Math.min(images.length, start + MAX_THUMBNAILS);

    // Adjust if we're near the end
    if (end - start < MAX_THUMBNAILS) {
      start = Math.max(0, end - MAX_THUMBNAILS);
    }

    return images
      .slice(start, end)
      .map((img, idx) => ({ image: img, originalIndex: start + idx }));
  }, [images, currentIndex]);

  // Calculate gap needed to prevent overlap when scaled
  // When a thumbnail scales to 1.5x, it grows by 40px (80 * 0.5)
  // Adjacent ones scale to 1.2x, growing by 16px (80 * 0.2)
  // We need at least 40px gap to prevent overlap
  const gap = Math.ceil(THUMBNAIL_SIZE * (MAX_SCALE - 1) / 2) + 4; // +4px for safety

  // Find the visible index that corresponds to the current image
  const visibleCurrentIndex = useMemo(() => {
    return visibleImages.findIndex((item) => item.originalIndex === currentIndex);
  }, [visibleImages, currentIndex]);

  // Auto-scroll to keep current thumbnail visible (if scrollable)
  useEffect(() => {
    if (!stripRef.current || visibleImages.length <= MAX_THUMBNAILS) return;

    const strip = stripRef.current;
    const thumbnail = strip.children[visibleCurrentIndex] as HTMLElement;

    if (thumbnail && strip.scrollTo) {
      const thumbnailLeft = thumbnail.offsetLeft;
      const thumbnailWidth = thumbnail.offsetWidth;
      const stripWidth = strip.offsetWidth;

      // Calculate ideal scroll position to center the thumbnail
      const idealScroll = thumbnailLeft - stripWidth / 2 + thumbnailWidth / 2;

      strip.scrollTo({
        left: idealScroll,
        behavior: 'smooth',
      });
    }
  }, [visibleCurrentIndex, visibleImages.length]);

  // Draggable strip with momentum
  const bind = useDrag(
    ({ offset: [ox], velocity: [vx], direction: [dx] }) => {
      if (!stripRef.current) return;

      const newScrollLeft = scrollLeft - ox;
      stripRef.current.scrollLeft = newScrollLeft;

      // Add momentum
      if (Math.abs(vx) > 0.5 && stripRef.current.scrollTo) {
        const momentum = vx * 100 * dx;
        stripRef.current.scrollTo({
          left: newScrollLeft - momentum,
          behavior: 'smooth',
        });
      }
    },
    {
      from: () => [scrollLeft, 0],
      axis: 'x',
    },
  );

  // Calculate magnification for each thumbnail based on hover
  const getMagnification = (index: number): number => {
    if (hoveredIndex === null) return 1;

    const distance = Math.abs(index - hoveredIndex);

    if (distance === 0) return 1.5; // Hovered thumbnail
    if (distance === 1) return 1.2; // Adjacent thumbnails
    if (distance === 2) return 1.1; // Second-level adjacent
    return 1; // All others
  };

  if (images.length === 0) return null;

  return (
    <div className="hidden md:flex absolute bottom-4 left-0 right-0 justify-center pointer-events-none">
      <div
        ref={stripRef}
        {...bind()}
        className="flex px-4 overflow-x-auto scrollbar-hide pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{
          gap: `${gap}px`,
          paddingBottom: '1rem',
          scrollBehavior: 'smooth',
          maxWidth: 'fit-content',
        }}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      >
        {visibleImages.map(({ image, originalIndex }, visibleIndex) => (
          <MagnifiableThumbnail
            key={image.id}
            image={image}
            isActive={originalIndex === currentIndex}
            onClick={() => onThumbnailClick(originalIndex)}
            onMouseEnter={() => setHoveredIndex(visibleIndex)}
            onMouseLeave={() => setHoveredIndex(null)}
            magnification={getMagnification(visibleIndex)}
          />
        ))}
      </div>
    </div>
  );
}
