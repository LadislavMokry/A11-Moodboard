import { useEffect, useRef, useState, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { type Image } from '@/schemas/image';
import { LightboxImage } from '@/components/LightboxImage';
import { LightboxControls } from '@/components/LightboxControls';
import { LightboxThumbnailStrip } from '@/components/LightboxThumbnailStrip';
import { LightboxCaptionPanel } from '@/components/LightboxCaptionPanel';
import { LightboxActions } from '@/components/LightboxActions';
import { getSupabasePublicUrl } from '@/lib/imageUtils';

interface LightboxProps {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onJumpTo?: (index: number) => void;
  onEditCaption?: (image: Image) => void;
  isOwner?: boolean;
  hideThumbnails?: boolean; // For testing
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.5;
const DISMISS_THRESHOLD = 100;

export function Lightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onJumpTo,
  onEditCaption,
  isOwner = false,
  hideThumbnails = false,
}: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Spring for swipe gestures
  const [{ x: swipeX, y: swipeY }, swipeApi] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { tension: 300, friction: 30 },
  }));

  // Focus trap: focus close button when lightbox opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Reset zoom when navigating between images
  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, [currentIndex]);

  // Handle background click (only close if not zoomed/panned)
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current && scale === 1 && panX === 0 && panY === 0) {
      onClose();
    }
  };

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(MIN_SCALE, prev - ZOOM_STEP);
      if (newScale === MIN_SCALE) {
        setPanX(0);
        setPanY(0);
      }
      return newScale;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const handlePanChange = useCallback((x: number, y: number) => {
    setPanX(x);
    setPanY(y);
  }, []);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (onJumpTo) {
        onJumpTo(index);
      }
    },
    [onJumpTo],
  );

  // Mobile swipe gestures
  const bindSwipe = useDrag(
    ({ offset: [ox, oy], velocity: [vx, vy], direction: [dx, dy], last, cancel }) => {
      // Only enable swipe when not zoomed and on mobile
      if (scale > MIN_SCALE || !isMobile) {
        cancel?.();
        return;
      }

      if (last) {
        // Swipe down to dismiss
        if (oy > DISMISS_THRESHOLD || (oy > 30 && vy > SWIPE_VELOCITY_THRESHOLD)) {
          onClose();
          return;
        }

        // Swipe left/right to navigate
        const swipeDistance = Math.abs(ox);
        const shouldSwipe = swipeDistance > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD;

        if (shouldSwipe) {
          if (dx < 0) {
            // Swipe left -> next
            onNext();
          } else if (dx > 0) {
            // Swipe right -> previous
            onPrev();
          }
        }

        // Reset position
        swipeApi.start({ x: 0, y: 0 });
      } else {
        // Follow finger during swipe
        swipeApi.start({ x: ox, y: oy, immediate: true });
      }
    },
    {
      from: () => [0, 0],
      filterTaps: true,
      axis: undefined,
    },
  );

  const currentImage = images[currentIndex];

  if (!currentImage) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackgroundClick}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Swipeable container for mobile */}
      <animated.div
        {...(isMobile && scale === MIN_SCALE ? bindSwipe() : {})}
        className="w-full h-full"
        style={
          isMobile && scale === MIN_SCALE
            ? {
                x: swipeX,
                y: swipeY,
                touchAction: 'none',
              }
            : undefined
        }
      >
        <LightboxImage
          image={currentImage}
          scale={scale}
          onScaleChange={setScale}
          onPanChange={handlePanChange}
        />
      </animated.div>

      <LightboxControls
        currentIndex={currentIndex}
        totalImages={images.length}
        scale={scale}
        onClose={onClose}
        onNext={onNext}
        onPrev={onPrev}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* Action buttons (download, copy URL, share) */}
      <LightboxActions
        imageUrl={getSupabasePublicUrl(currentImage.storage_path)}
        filename={currentImage.original_filename}
      />

      {/* Caption panel (desktop only, right side) */}
      <LightboxCaptionPanel
        caption={currentImage.caption}
        isOwner={isOwner}
        onEditClick={onEditCaption ? () => onEditCaption(currentImage) : undefined}
      />

      {/* Desktop thumbnail strip */}
      {!isMobile && !hideThumbnails && (
        <LightboxThumbnailStrip
          images={images}
          currentIndex={currentIndex}
          onThumbnailClick={handleThumbnailClick}
        />
      )}

      {/* Hidden button for focus trap reference */}
      <button
        ref={closeButtonRef}
        className="sr-only"
        onClick={onClose}
        aria-label="Close lightbox (focused for keyboard navigation)"
      />
    </div>
  );
}
