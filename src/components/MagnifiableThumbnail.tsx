import { useState as _useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { type Image } from '@/schemas/image';
import { getSupabasePublicUrl } from '@/lib/imageUtils';

interface MagnifiableThumbnailProps {
  image: Image;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  magnification: number;
}

export function MagnifiableThumbnail({
  image,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  magnification,
}: MagnifiableThumbnailProps) {
  const src = getSupabasePublicUrl(image.storage_path);

  const [spring] = useSpring(
    () => ({
      scale: magnification,
      config: { tension: 300, friction: 20 },
    }),
    [magnification],
  );

  return (
    <div className="relative w-full h-auto">
      <animated.button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`w-full h-full transition-all duration-200 ${
          isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-black/95' : ''
        }`}
        style={{
          transformOrigin: 'center center',
          scale: spring.scale,
          zIndex: magnification > 1 ? 10 : 1,
        }}
        aria-label={`View ${image.caption || 'image'}`}
      >
        <img
          src={src}
          alt={image.caption || ''}
          className="w-full h-full object-contain rounded-sm pointer-events-none"
        />
      </animated.button>
    </div>
  );
}
