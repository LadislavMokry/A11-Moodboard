import { MasonryGrid } from "@/components/MasonryGrid";
import { useShowcaseBoard } from "@/hooks/useShowcaseBoard";
import { useEffect, useRef, useState } from "react";

/**
 * Animated showcase board for the homepage (signed-out view)
 * Displays images in Pinterest-style masonry grid layout with vertical drift animation
 */
export function ShowcaseBoard() {
  console.log("ShowcaseBoard: Rendering");
  const { data: board, isLoading, error } = useShowcaseBoard();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  console.log("ShowcaseBoard: State", { isLoading, error: !!error, board: !!board, isVisible });

  // Intersection Observer to start animation only when visible
  useEffect(() => {
    const rootElement = document.getElementById('main-content');
    console.log("ShowcaseBoard: Setting up IntersectionObserver with root", rootElement);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log("ShowcaseBoard: IntersectionObserver entry", { isIntersecting: entry.isIntersecting });
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        root: rootElement,
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
      console.log("ShowcaseBoard: IntersectionObserver observing");
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
        console.log("ShowcaseBoard: IntersectionObserver unobserving");
      }
    };
  }, []);

  if (isLoading) {
    console.log("ShowcaseBoard: Render isLoading");
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-600" />
      </div>
    );
  }

  if (error || !board) {
    console.log("ShowcaseBoard: Render error or no board", { error, board });
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Unable to load showcase</p>
      </div>
    );
  }

  console.log("ShowcaseBoard: Render MasonryGrid");
  return (
    <div
      ref={containerRef}
      className={`showcase-board h-full w-full ${isVisible ? "" : "opacity-0"}`}
    >
      <MasonryGrid
        images={board.images}
        minCardWidth={180} // Smaller cards for denser layout
        gap={8} // Tight spacing
        maxHeight="100vh" // Fixed height, no scrolling
        alternatingDirection={true} // Enable waterfall alternating directions
      />
    </div>
  );
}
