import { MasonryGrid } from "@/components/MasonryGrid";
import { useShowcaseBoard } from "@/hooks/useShowcaseBoard";
import { useEffect, useRef, useState } from "react";

/**
 * Animated showcase board for the homepage (signed-out view)
 * Displays images in Pinterest-style masonry grid layout with vertical drift animation
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
      { threshold: 0.1 }
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-600" />
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

  return (
    <div
      ref={containerRef}
      className={`showcase-board h-full w-full ${isVisible ? "" : "opacity-0"}`}
    >
      <MasonryGrid
        images={board.images}
        minCardWidth={220} // Slightly larger for homepage showcase
        gap={16} // More generous spacing for homepage
        wideAspectRatio={1.8} // More permissive wide image threshold
        wideSpan={2}
      />
    </div>
  );
}
