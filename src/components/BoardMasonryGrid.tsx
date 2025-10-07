import { cn } from "@/lib/utils";
import { type Image } from "@/schemas/image";
import type { DraggableAttributes } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ImageGridItem } from "./ImageGridItem";

type SyntheticListenerMap = Record<string, Function> | undefined;

interface BoardMasonryGridProps {
  images: Image[];
  onImageClick?: (image: Image) => void;
  onImageMenuClick?: (image: Image, event: React.MouseEvent) => void;
  // Configuration props
  minCardWidth?: number; // Minimum width for each card in pixels (default: 220)
  gap?: number; // Gap between items in pixels (default: 12)
  // Selection props (passed through to ImageGridItem)
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (imageId: string) => void;
  // Drag and drop props (passed through to ImageGridItem)
  setItemRef?: (imageId: string, node: HTMLDivElement | null) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  dragStyle?: CSSProperties;
  isDragging?: boolean;
  dataTestId?: string;
}

/**
 * BoardMasonryGrid - Creates a Pinterest-style masonry layout for the board page
 * Features:
 * - CSS Flexbox columns for true masonry effect
 * - Responsive column count
 * - Savee-like styling (no borders, images fit without cropping)
 */
export function BoardMasonryGrid({
  images,
  onImageClick,
  onImageMenuClick,
  minCardWidth = 220,
  gap = 12,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  setItemRef,
  dragAttributes,
  dragListeners,
  dragStyle,
  isDragging = false,
  dataTestId
}: BoardMasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate number of columns based on container width
  const columnCount = useMemo(() => {
    if (!containerWidth) return 2; // Default fallback

    const columns = Math.max(1, Math.floor(containerWidth / minCardWidth));
    const count = Math.min(columns, 6); // Max 6 columns
    return count;
  }, [containerWidth, minCardWidth]);

  // ResizeObserver to track container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    setContainerWidth(container.offsetWidth);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle image click with selection mode support
  const handleImageClick = useCallback(
    (image: Image) => {
      if (selectionMode && onToggleSelection) {
        onToggleSelection(image.id);
      } else if (onImageClick) {
        onImageClick(image);
      }
    },
    [selectionMode, onToggleSelection, onImageClick]
  );

  // Sort images by position (should already be sorted from API, but ensure it)
  const sortedImages = useMemo(() => [...images].sort((a, b) => a.position - b.position), [images]);

  const columns = useMemo(() => {
    const buckets: Image[][] = Array.from({ length: columnCount }, () => []);

    sortedImages.forEach((image, index) => {
      const columnIndex = columnCount > 0 ? index % columnCount : 0;
      buckets[columnIndex].push(image);
    });

    return buckets;
  }, [sortedImages, columnCount]);

  if (sortedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Upload images to get started</p>
      </div>
    );
  }

  const containerStyle: CSSProperties = {
    display: "flex",
    columnGap: gap,
    alignItems: "flex-start"
  };

  const columnStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="w-full"
      data-testid={dataTestId}
    >
      {columns.map((columnImages, columnIndex) => {
        return (
          <div
            key={columnIndex}
            style={columnStyle}
            className="board-masonry-column"
          >
            {columnImages.map((image, imageIndex) => {
              const isLastItem = imageIndex === columnImages.length - 1;
              return (
                <div
                  key={image.id}
                  style={{ marginBottom: isLastItem ? 0 : gap }}
                >
                  <ImageGridItem
                    image={image}
                    onClick={() => handleImageClick(image)}
                    onMenuClick={(e) => onImageMenuClick?.(image, e)}
                    setRef={setItemRef ? (node) => setItemRef(image.id, node) : undefined}
                    dragAttributes={dragAttributes}
                    dragListeners={dragListeners}
                    style={{
                      ...(dragStyle ?? {}),
                      flexShrink: 0,
                      width: "100%"
                    }}
                    className={cn(isDragging && "opacity-50")}
                    dataTestId={`waterfall-item-${image.id}`}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(image.id)}
                    onToggleSelection={() => onToggleSelection?.(image.id)}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
