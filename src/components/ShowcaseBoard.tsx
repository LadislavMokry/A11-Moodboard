import { MasonryGrid } from "@/components/MasonryGrid";
import { useShowcaseBoard } from "@/hooks/useShowcaseBoard";
import { useUserImages } from "@/hooks/useUserImages"; // Import the new hook

interface ShowcaseBoardProps {
  userId?: string; // Optional userId prop
}

/**
 * Animated showcase board for the homepage (signed-out view)
 * Displays images in Pinterest-style masonry grid layout with vertical drift animation
 */
export function ShowcaseBoard({ userId }: ShowcaseBoardProps) { // Add userId to props
  const { data: publicBoard, isLoading: isLoadingPublic, error: errorPublic } = useShowcaseBoard();
  const { data: userImages, isLoading: isLoadingUser, error: errorUser } = useUserImages({ userId: userId || "", enabled: !!userId });

  const displayImages = userId && userImages && userImages.length >= 10 ? userImages : publicBoard?.images;
  const isLoading = userId ? isLoadingUser : isLoadingPublic;
  const error = userId ? errorUser : errorPublic;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-600" />
      </div>
    );
  }

  if (error || !displayImages || displayImages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Unable to load showcase</p>
      </div>
    );
  }

  return (
    <div className="showcase-board h-full w-full">
      <MasonryGrid
        images={displayImages}
        minCardWidth={180} // Smaller cards for denser layout
        gap={8} // Tight spacing
        maxHeight="100%" // Fixed height, no scrolling
        alternatingDirection={true} // Enable waterfall alternating directions
      />
    </div>
  );
}