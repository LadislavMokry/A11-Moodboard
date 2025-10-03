import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface LightboxControlsProps {
  currentIndex: number;
  totalImages: number;
  scale: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function LightboxControls({
  currentIndex,
  totalImages,
  scale,
  onClose,
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: LightboxControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    setIsVisible(true);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onMouseMove={resetInactivityTimer}
      onTouchStart={resetInactivityTimer}
    >
      {/* Close button - top right */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Image counter - top left */}
      <div
        className={`absolute top-4 left-4 px-3 py-2 bg-black/60 rounded-sm backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-sm text-white font-medium">
          {currentIndex + 1} / {totalImages}
        </span>
      </div>

      {/* Previous button - left center (disabled when zoomed) */}
      {totalImages > 1 && scale === 1 && (
        <button
          onClick={onPrev}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Next button - right center (disabled when zoomed) */}
      {totalImages > 1 && scale === 1 && (
        <button
          onClick={onNext}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Zoom controls - bottom center */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full backdrop-blur-sm p-1 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={onZoomOut}
          disabled={scale <= 1}
          className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>

        <div className="px-2 min-w-[3rem] text-center">
          <span className="text-sm text-white font-medium">{scale.toFixed(1)}x</span>
        </div>

        <button
          onClick={onZoomIn}
          disabled={scale >= 5}
          className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>

        {scale > 1 && (
          <button
            onClick={onZoomReset}
            className="p-2 hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
