import { useState, useEffect, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { type Image } from '@/schemas/image';
import { getSupabasePublicUrl } from '@/lib/imageUtils';

interface LightboxImageProps {
  image: Image;
  scale: number;
  onScaleChange: (scale: number) => void;
  onPanChange: (x: number, y: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export function LightboxImage({ image, scale, onScaleChange, onPanChange }: LightboxImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const src = getSupabasePublicUrl(image.storage_path);

  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { tension: 300, friction: 30 },
  }));

  // Reset zoom and pan when image changes
  useEffect(() => {
    onScaleChange(1);
    api.start({ x: 0, y: 0, immediate: true });
  }, [image.id, onScaleChange, api]);

  // Calculate max pan bounds based on image size and scale
  const getMaxPan = () => {
    if (!imgRef.current || !containerRef.current) return { maxX: 0, maxY: 0 };

    const imgRect = imgRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

    return { maxX, maxY };
  };

  // Constrain pan to bounds
  const constrainPan = (newX: number, newY: number) => {
    const { maxX, maxY } = getMaxPan();
    return {
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    };
  };

  const bind = useGesture(
    {
      // Wheel zoom
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale - dy * 0.01));
        onScaleChange(newScale);

        // Reset pan when zooming out to 1x
        if (newScale === MIN_SCALE) {
          api.start({ x: 0, y: 0 });
          onPanChange(0, 0);
        }
      },

      // Pinch zoom (mobile)
      onPinch: ({ offset: [s], event }) => {
        event.preventDefault();
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
        onScaleChange(newScale);

        if (newScale === MIN_SCALE) {
          api.start({ x: 0, y: 0 });
          onPanChange(0, 0);
        }
      },

      // Drag to pan (only when zoomed)
      onDrag: ({ offset: [ox, oy], event }) => {
        if (scale <= MIN_SCALE) return;
        event.preventDefault();

        const constrained = constrainPan(ox, oy);
        api.start({ x: constrained.x, y: constrained.y });
        onPanChange(constrained.x, constrained.y);
      },

      // Double click/tap to zoom
      onDoubleClick: ({ event }) => {
        event.preventDefault();
        const newScale = scale > MIN_SCALE ? MIN_SCALE : 2;
        onScaleChange(newScale);

        if (newScale === MIN_SCALE) {
          api.start({ x: 0, y: 0 });
          onPanChange(0, 0);
        }
      },
    },
    {
      drag: { from: () => [x.get(), y.get()] },
      pinch: { scaleBounds: { min: MIN_SCALE, max: MAX_SCALE }, from: () => [scale, 0] },
    },
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsLoading(false);
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full p-4 touch-none"
      {...bind()}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-neutral-600 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <animated.img
        ref={imgRef}
        src={src}
        alt={image.caption || ''}
        className="max-w-full max-h-full object-contain select-none"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 200ms ease-in-out',
          transform: x.to((xVal) => `translate3d(${xVal}px, ${y.get()}px, 0) scale(${scale})`),
          cursor: scale > MIN_SCALE ? 'grab' : 'zoom-in',
        }}
        onLoad={handleImageLoad}
        draggable={false}
      />
    </div>
  );
}
