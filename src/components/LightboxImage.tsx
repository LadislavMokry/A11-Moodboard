import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated, to } from '@react-spring/web';
import { type Image } from '@/schemas/image';
import { getSupabasePublicUrl, getSupabaseThumbnail } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';

interface LightboxImageProps {
  image: Image;
  scale: number;
  onScaleChange: (scale: number) => void;
  onPanChange: (x: number, y: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export const LightboxImage = forwardRef<HTMLDivElement, LightboxImageProps>(function LightboxImage({ image, scale, onScaleChange, onPanChange }, ref) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fullSrc = getSupabasePublicUrl(image.storage_path);
  const previewSrc = getSupabaseThumbnail(image.storage_path, 600);
  const src1080 = getSupabaseThumbnail(image.storage_path, 1080);
  const src720 = getSupabaseThumbnail(image.storage_path, 720);
  const src360 = getSupabaseThumbnail(image.storage_path, 360);

  const fallbackSources = useMemo(() => {
    const candidates = [src1080, src720, src360, previewSrc].filter((srcOption): srcOption is string => Boolean(srcOption));
    const unique = candidates.filter((srcOption, index, array) => array.indexOf(srcOption) === index);
    return unique;
  }, [src1080, src720, src360, previewSrc]);

  const [currentSrc, setCurrentSrc] = useState(fullSrc);
  const fallbackIndexRef = useRef(0);

  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { tension: 300, friction: 30 },
  }));
  const panStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom, pan and loading state when image changes
  useEffect(() => {
    onScaleChange(1);
    api.start({ x: 0, y: 0, immediate: true });
    setIsLoading(true);
    setIsPreviewLoaded(false);
    setHasError(false);
    fallbackIndexRef.current = 0;
    setCurrentSrc(fullSrc);
  }, [image.id, fullSrc, onScaleChange, api]);

  // Calculate max pan bounds based on image size and scale
  const getMaxPan = () => {
    if (!imgRef.current || !containerRef.current) return { maxX: 0, maxY: 0 };

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
      onDrag: ({ first, movement: [mx, my], event }) => {
        if (scale <= MIN_SCALE) return;
        event.preventDefault();
        event.stopPropagation();

        if (first) {
          panStartRef.current = { x: x.get(), y: y.get() };
        }

        const targetX = panStartRef.current.x + mx;
        const targetY = panStartRef.current.y + my;

        const constrained = constrainPan(targetX, targetY);
        api.start({ x: constrained.x, y: constrained.y, immediate: true });
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
      drag: { preventScroll: true },
      pinch: { scaleBounds: { min: MIN_SCALE, max: MAX_SCALE }, from: () => [scale, 0] },
    },
  );

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    if (fallbackIndexRef.current < fallbackSources.length) {
      const nextSrc = fallbackSources[fallbackIndexRef.current];
      fallbackIndexRef.current += 1;
      setIsLoading(true);
      setCurrentSrc(nextSrc);
      return;
    }

    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div
      ref={ref}
      className="relative flex h-full w-full items-center justify-center p-4 touch-none"
      style={{ contain: 'layout paint' }}
      {...bind()}
    >
      {previewSrc && (
        <img
          src={previewSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full object-contain blur-2xl transition-opacity duration-300',
            isLoading && isPreviewLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => setIsPreviewLoaded(true)}
        />
      )}

      <Skeleton
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-300',
          (isPreviewLoaded || !isLoading) ? 'opacity-0' : 'opacity-100',
        )}
      />

      <animated.img
        ref={imgRef}
        src={currentSrc}
        alt={image.caption || ''}
        className="relative z-10 max-h-full max-w-full select-none object-contain"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 200ms ease-in-out',
          transform: to([x, y], (xVal, yVal) => `translate3d(${xVal}px, ${yVal}px, 0) scale(${scale})`),
          cursor: scale > MIN_SCALE ? 'grab' : 'zoom-in',
        }}
        onClick={(event) => event.stopPropagation()}
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
      />

      {hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/80 px-6 text-center">
          <p className="text-sm text-neutral-200">We couldn&apos;t load this image. Please try again later.</p>
        </div>
      )}
    </div>
  );
});
