import { ImageGridItem } from "@/components/ImageGridItem";
import { cn } from "@/lib/utils";
import { useShowcaseBoard } from "@/hooks/useShowcaseBoard";
import { useUserImages } from "@/hooks/useUserImages";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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

  const displayImages = useMemo(() => {
    if (userId && userImages && userImages.length >= 10) {
      return userImages;
    }
    return publicBoard?.images;
  }, [userId, userImages, publicBoard]);

  const isLoading = userId ? isLoadingUser : isLoadingPublic;
  const error = userId ? errorUser : errorPublic;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    setContainerWidth(container.offsetWidth);

    return () => resizeObserver.disconnect();
  }, []);

  const columnCount = useMemo(() => {
    if (!containerWidth) {
      return 3;
    }

    const minCardWidth = 220;
    const calculatedColumns = Math.max(1, Math.floor(containerWidth / minCardWidth));
    return Math.min(calculatedColumns, 6);
  }, [containerWidth]);

  const sortedImages = useMemo(() => {
    if (!displayImages) {
      return [];
    }
    return [...displayImages].sort((a, b) => a.position - b.position);
  }, [displayImages]);

  const columns = useMemo(() => {
    if (columnCount === 0) {
      return [];
    }

    const columnBuckets = Array.from({ length: columnCount }, () => [] as typeof sortedImages);

    sortedImages.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columnBuckets[columnIndex].push(image);
    });

    return columnBuckets;
  }, [sortedImages, columnCount]);

  const containerStyle: CSSProperties = useMemo(() => ({
    height: "100%",
    overflow: "hidden",
    display: "flex",
    gap: "8px"
  }), []);

  const columnStyle: CSSProperties = useMemo(() => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  }), []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-600" />
      </div>
    );
  }

  if (error || sortedImages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Unable to load showcase</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="showcase-board h-full w-full" style={containerStyle}>
      {columns.map((columnImages, columnIndex) => {
        const isReversed = columnIndex % 2 === 1;
        const repeatedImages = columnImages.length > 0 ? Array.from({ length: 4 }, () => columnImages).flat() : [];

        return (
          <div
            key={columnIndex}
            style={{
              ...columnStyle,
              flexDirection: isReversed ? "column-reverse" : "column"
            }}
            className={cn(
              "waterfall-column",
              isReversed && "flex-col-reverse",
              isReversed ? "showcase-column-down" : "showcase-column-up"
            )}
          >
            {repeatedImages.map((image, imageIndex) => (
              <ImageGridItem
                key={`${image.id}-${imageIndex}`}
                image={image}
                style={{
                  flexShrink: 0,
                  width: "100%",
                  height: "auto"
                }}
                dataTestId={`waterfall-item-${image.id}`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
