import { LightboxActions } from "@/components/LightboxActions";
import { LightboxCaptionPanel } from "@/components/LightboxCaptionPanel";
import { LightboxControls } from "@/components/LightboxControls";
import { LightboxImage } from "@/components/LightboxImage";
import { LightboxThumbnailStrip } from "@/components/LightboxThumbnailStrip";
import { getSupabasePublicUrl } from "@/lib/imageUtils";
import { type Image } from "@/schemas/image";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

interface LightboxProps {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onJumpTo?: (index: number) => void;
  onEditCaption?: (image: Image) => void;
  onDelete?: (image: Image) => void;
  isOwner?: boolean;
  hideThumbnails?: boolean; // For testing
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.5;
const DISMISS_THRESHOLD = 100;

export const Lightbox = memo(function Lightbox({ images, currentIndex, onClose, onNext, onPrev, onJumpTo, onEditCaption, onDelete, isOwner = false, hideThumbnails = false }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const captionPanelRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isCaptionPanelOpen, setIsCaptionPanelOpen] = useState(false);

  const toggleCaptionPanel = () => setIsCaptionPanelOpen((prev) => !prev);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Spring for swipe gestures
  const [{ x: swipeX, y: swipeY }, swipeApi] = useSpring(() => ({
    x: 0,
    y: 0,
    config: { tension: 300, friction: 30 }
  }));

  // Focus trap: focus close button when lightbox opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Reset zoom when navigating between images
  useEffect(() => {
    setScale(1);
    panRef.current = { x: 0, y: 0 };
  }, [currentIndex]);



  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(MIN_SCALE, prev - ZOOM_STEP);
      if (newScale === MIN_SCALE) {
        panRef.current = { x: 0, y: 0 };
      }
      return newScale;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    panRef.current = { x: 0, y: 0 };
  }, []);

  const handlePanChange = useCallback((x: number, y: number) => {
    panRef.current = { x, y };
  }, []);

  const currentImage = images[currentIndex];

  const handleEditCaption = useCallback(() => {
    if (onEditCaption) {
      setIsCaptionPanelOpen(true);
      onEditCaption(currentImage);
    }
  }, [onEditCaption, currentImage]);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (onJumpTo) {
        onJumpTo(index);
      }
    },
    [onJumpTo]
  );

  // Mobile swipe gestures
  const bindSwipe = useDrag(
    ({ offset: [ox, oy], velocity: [vx, vy], direction: [dx, _dy], last, cancel }) => {
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
      axis: undefined
    }
  );

  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (scale > MIN_SCALE) {
        return;
      }

      const target = event.target as Node;

      if (imageContainerRef.current) {
        const mainImage = imageContainerRef.current.querySelector<HTMLImageElement>("img.relative");
        if (mainImage && mainImage.contains(target)) {
          return;
        }
      }

      if (captionPanelRef.current?.contains(target)) {
        return;
      }

      onClose();
    },
    [onClose, scale]
  );

  const thumbnailStrip = !hideThumbnails ? (
    <LightboxThumbnailStrip
      images={images}
      currentIndex={currentIndex}
      onThumbnailClick={handleThumbnailClick}
    />
  ) : null;

  if (!currentImage) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={handleOverlayClick}
    >
      {/* Swipeable container for mobile */}
      <animated.div
        ref={contentRef}
        {...(isMobile && scale === MIN_SCALE ? bindSwipe() : {})}
        className="w-full h-full"
        style={{
          paddingTop: '10vh',
          paddingBottom: '10vh',
          ...(isMobile && scale === MIN_SCALE
            ? {
                x: swipeX,
                y: swipeY,
                touchAction: "none"
              }
            : {}),
        }}
      >
        <LightboxImage
          ref={imageContainerRef}
          image={currentImage}
          scale={scale}
          onScaleChange={setScale}
          onPanChange={handlePanChange}
        />
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
      </animated.div>
      <LightboxActions
        imageUrl={getSupabasePublicUrl(currentImage.storage_path)}
        filename={currentImage.original_filename || ""}
        isOwner={isOwner}
        onDelete={onDelete ? () => onDelete(currentImage) : undefined}
        isCaptionPanelOpen={isCaptionPanelOpen}
        onToggleCaptionPanel={toggleCaptionPanel}
        onEditCaption={handleEditCaption}
      />

      {/* Caption panel (desktop only, right side) */}
      <LightboxCaptionPanel
        ref={captionPanelRef}
        caption={currentImage.caption || null}
        isOwner={isOwner}
        thumbnails={thumbnailStrip}
        isOpen={isCaptionPanelOpen}
      />

      {/* Hidden button for focus trap reference */}
      <button
        ref={closeButtonRef}
        className="sr-only"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close lightbox (focused for keyboard navigation)"
      />
    </div>
  );
});
