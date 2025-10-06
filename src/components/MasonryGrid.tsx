import { cn } from "@/lib/utils";
import { type Image } from "@/schemas/image";
import type { DraggableAttributes } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ImageGridItem } from "./ImageGridItem";

type SyntheticListenerMap = Record<string, Function> | undefined;

interface MasonryGridProps {
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
  // Waterfall specific props
  maxHeight?: string; // Maximum height for the container (default: 100vh)
  alternatingDirection?: boolean; // Enable alternating column direction (default: true)
}

/**
 * WaterfallMasonryGrid - Creates a Pinterest-style waterfall layout
 * Features:
 * - CSS Flexbox columns for true waterfall effect
 * - Alternating column directions (top-to-bottom, bottom-to-top)
 * - Fixed height container (no scrolling)
 * - Responsive column count
 */
export function MasonryGrid({ images, onImageClick, onImageMenuClick, minCardWidth = 220, gap = 12, selectionMode = false, selectedIds = new Set(), onToggleSelection, setItemRef, dragAttributes, dragListeners, dragStyle, isDragging = false, dataTestId, maxHeight = "100vh", alternatingDirection = true }: MasonryGridProps) {
  console.log("MasonryGrid: Rendering", { imageCount: images.length, minCardWidth, gap, selectionMode, isDragging, maxHeight, alternatingDirection });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate number of columns based on container width
  const columnCount = useMemo(() => {
    if (!containerWidth) return 2; // Default fallback

    const columns = Math.max(1, Math.floor(containerWidth / minCardWidth));
    const count = Math.min(columns, 6); // Max 6 columns
    console.log("MasonryGrid: Calculated columnCount", { containerWidth, minCardWidth, count });
    return count;
  }, [containerWidth, minCardWidth]);

  // ResizeObserver to track container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        console.log("MasonryGrid: ResizeObserver entry", { contentRectWidth: entry.contentRect.width });
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    setContainerWidth(container.offsetWidth);
    console.log("MasonryGrid: Initial container width", { offsetWidth: container.offsetWidth });

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
  const sortedImages = useMemo(() => {
    console.log("MasonryGrid: Sorting images");
    return [...images].sort((a, b) => a.position - b.position);
  }, [images]);

  if (sortedImages.length === 0) {
    console.log("MasonryGrid: No images to display");
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Upload images to get started</p>
      </div>
    );
  }

  // Distribute images across columns
  const columns: Image[][] = Array.from({ length: columnCount }, () => []);

  sortedImages.forEach((image, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(image);
  });
  console.log("MasonryGrid: Distributed images into columns", { columnCount, columns });

  const containerStyle: CSSProperties = {
    height: maxHeight,
    overflow: "hidden",
    display: "flex",
    gap: `${gap}px`
  };

  const columnStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: `${gap}px`,
    overflow: "hidden"
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="w-full"
      data-testid={dataTestId}
    >
      {columns.map((columnImages, columnIndex) => {
        // Alternate direction for each column
        const isReversed = alternatingDirection && columnIndex % 2 === 1;

        return (
          <div
            key={columnIndex}
            style={{
              ...columnStyle,
              flexDirection: isReversed ? "column-reverse" : "column"
            }}
            className={cn("waterfall-column", isReversed && "flex-col-reverse")}
          >
            {columnImages.map((image) => (
              <ImageGridItem
                key={image.id}
                image={image}
                onClick={() => handleImageClick(image)}
                onMenuClick={(e) => onImageMenuClick?.(image, e)}
                setRef={setItemRef ? (node) => setItemRef(image.id, node) : undefined}
                dragAttributes={dragAttributes}
                dragListeners={dragListeners}
                style={{
                  ...(dragStyle ?? {}),
                  flexShrink: 0,
                  // Let images maintain their aspect ratio
                  width: "100%",
                  height: "auto"
                }}
                className={cn(isDragging && "opacity-50")}
                dataTestId={`waterfall-item-${image.id}`}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(image.id)}
                onToggleSelection={() => onToggleSelection?.(image.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
