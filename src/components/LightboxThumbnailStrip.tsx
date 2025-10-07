import { useMemo } from 'react';
import { type Image } from '@/schemas/image';
import { MagnifiableThumbnail } from '@/components/MagnifiableThumbnail';

interface LightboxThumbnailStripProps {
  images: Image[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
}

export function LightboxThumbnailStrip({
  images,
  currentIndex,
  onThumbnailClick,
}: LightboxThumbnailStripProps) {
  const visibleImages = useMemo(() => {
    return images.map((img, idx) => ({ image: img, originalIndex: idx }));
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className="h-full w-full overflow-y-auto">
      <div
        className="grid grid-cols-3 gap-2 p-1"
      >
        {visibleImages.map(({ image, originalIndex }) => (
          <MagnifiableThumbnail
            key={image.id}
            image={image}
            isActive={originalIndex === currentIndex}
            onClick={() => onThumbnailClick(originalIndex)}
            // Disable magnification on vertical strip for now
            magnification={1}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
