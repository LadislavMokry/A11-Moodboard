import { useEffect, useRef } from 'react';
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

export function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: focus close button when lightbox opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Handle background click
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

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
      <LightboxImage image={currentImage} />
      <LightboxControls
        currentIndex={currentIndex}
        totalImages={images.length}
        onClose={onClose}
        onNext={onNext}
        onPrev={onPrev}
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
