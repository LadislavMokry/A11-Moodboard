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
    <div className="h-full w-full overflow-y-auto py-2">
      <div className="flex flex-col gap-2 px-2">
        {visibleImages.map(({ image, originalIndex }) => (
          <MagnifiableThumbnail
            key={image.id}
            image={image}
            isActive={originalIndex === currentIndex}
            onClick={() => onThumbnailClick(originalIndex)}
            magnification={1}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
