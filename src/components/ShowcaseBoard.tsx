import { MasonryGrid } from "@/components/MasonryGrid";
import { useShowcaseBoard } from "@/hooks/useShowcaseBoard";

/**
 * Animated showcase board for the homepage (signed-out view)
 * Displays images in Pinterest-style masonry grid layout with vertical drift animation
 */
export function ShowcaseBoard() {
  const { data: board, isLoading, error } = useShowcaseBoard();

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
    <div className="showcase-board h-full w-full">
      <MasonryGrid
        images={board.images}
        minCardWidth={180} // Smaller cards for denser layout
        gap={8} // Tight spacing
        maxHeight="100%" // Fixed height, no scrolling
        alternatingDirection={true} // Enable waterfall alternating directions
      />
    </div>
  );
}