import { MasonryGrid } from "@/components/MasonryGrid";
import { useShowcaseBoard } from "@/hooks/useShowcaseBoard";
import { useUserImages } from "@/hooks/useUserImages";
import { shuffleArray } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

interface ShowcaseBoardProps {
  userId?: string;
}

/**
 * Animated showcase board for the homepage (signed-out view)
 * Displays images in a multi-column waterfall layout with vertical drift animation
 */
export function ShowcaseBoard({ userId }: ShowcaseBoardProps) {
  const { data: publicBoard, isLoading: isLoadingPublic, error: errorPublic } = useShowcaseBoard();
  const { data: userImages, isLoading: isLoadingUser, error: errorUser } = useUserImages({ userId: userId || "", enabled: !!userId });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayImages = useMemo(() => {
    const sourceImages = userId && userImages && userImages.length >= 10 ? userImages : publicBoard?.images ?? [];
    if (sourceImages.length === 0) {
      return [];
    }

    const shuffled = shuffleArray(sourceImages);
    return shuffled.map((image, index) => ({
      ...image,
      position: index + 1,
    }));
  }, [userId, userImages, publicBoard]);

  const isLoading = userId ? isLoadingUser : isLoadingPublic;
  const error = userId ? errorUser : errorPublic;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-600" />
      </div>
    );
  }

  if (error || displayImages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Unable to load showcase</p>
      </div>
    );
  }

  return (
    <div className="showcase-board relative h-full w-full overflow-hidden rounded-2xl md:rounded-3xl border border-neutral-200 dark:border-neutral-800">
      <MasonryGrid
        images={displayImages}
        minCardWidth={isMobile ? 160 : 180}
        gap={8}
        alternatingDirection
        readOnly
        fitStyle="contain"
        columnCountOverride={isMobile ? 2 : undefined}
      />
    </div>
  );
}
