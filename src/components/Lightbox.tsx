import { useEffect, useRef, useState, useCallback } from 'react';
import { type Image } from '@/schemas/image';
import { LightboxImage } from '@/components/LightboxImage';
import { LightboxControls } from '@/components/LightboxControls';

interface LightboxProps {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;

export function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

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
      <LightboxImage
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
