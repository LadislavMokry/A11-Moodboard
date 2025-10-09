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
  return (
    <>
      {/* Image counter - top left */}
      <div
        className="absolute top-4 left-4 flex items-center gap-2 rounded-sm bg-black/60 px-3 py-2 backdrop-blur-sm transition-opacity duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="rounded-full p-1 transition-colors hover:bg-white/10"
          aria-label="Close lightbox"
        >
          <X className="h-4 w-4 text-white" />
        </button>
        <span className="text-sm font-medium text-white">
          {currentIndex + 1} / {totalImages}
        </span>
      </div>

      {/* Close button - top right */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Previous button - left center (disabled when zoomed) */}
      {totalImages > 1 && scale === 1 && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Next button - right center (disabled when zoomed) */}
      {totalImages > 1 && scale === 1 && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Zoom controls - bottom center */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full backdrop-blur-sm p-1 transition-opacity duration-300"
        style={{ zIndex: 20 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={(event) => {
            event.stopPropagation();
            onZoomOut();
          }}
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
          onClick={(event) => {
            event.stopPropagation();
            onZoomIn();
          }}
          disabled={scale >= 5}
          className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>

        {scale > 1 && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onZoomReset();
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </>
  );
}
