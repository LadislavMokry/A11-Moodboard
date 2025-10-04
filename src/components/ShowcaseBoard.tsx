import { useEffect, useRef, useState } from 'react';
import { useShowcaseBoard } from '@/hooks/useShowcaseBoard';
import { getSupabaseThumbnail } from '@/lib/imageUtils';
import { type Image } from '@/schemas/image';

/**
 * Animated showcase board for the homepage (signed-out view)
 * Displays images in 3-column masonry layout with vertical drift animation
 */
export function ShowcaseBoard() {
  const { data: board, isLoading, error } = useShowcaseBoard();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer to start animation only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-violet-600" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Unable to load showcase</p>
      </div>
    );
  }

  // Split images into 3 columns for masonry layout
  const images = board.images;
  const columns: Image[][] = [[], [], []];

  images.forEach((image, index) => {
    columns[index % 3].push(image);
  });

  return (
    <div
      ref={containerRef}
      className={`showcase-board h-full w-full ${isVisible ? '' : 'opacity-0'}`}
    >
      <div className="flex h-full gap-4">
        {columns.map((columnImages, columnIndex) => (
          <div
            key={columnIndex}
            className={`showcase-column-${columnIndex + 1} flex flex-1 flex-col gap-4`}
          >
            {columnImages.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg"
                style={{
                  aspectRatio: image.width && image.height ? image.width / image.height : 1,
                }}
              >
                <img
                  src={getSupabaseThumbnail(image.storage_path, 600)}
                  alt={image.caption || ''}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
