import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxControlsProps {
  currentIndex: number;
  totalImages: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function LightboxControls({
  currentIndex,
  totalImages,
  onClose,
  onNext,
  onPrev,
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

      {/* Previous button - left center */}
      {totalImages > 1 && (
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

      {/* Next button - right center */}
      {totalImages > 1 && (
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
    </div>
  );
}
