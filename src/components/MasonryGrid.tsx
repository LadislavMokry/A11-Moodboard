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
  rowUnit?: number; // Row unit height for grid calculation (default: 8)
  wideAspectRatio?: number; // Aspect ratio threshold for wide images (default: 1.6)
  wideSpan?: number; // How many columns wide images should span (default: 2)
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

interface MasonryItem extends Image {
  gridRowSpan?: number;
  gridColumnSpan?: number;
  aspectRatio: number;
  measuredHeight?: number;
}

/**
 * MasonryGrid component that implements a Pinterest-style masonry layout using CSS Grid.
 * Features:
 * - Variable height cards based on image aspect ratios
 * - Wide images can span multiple columns
 * - Configurable card sizes and spacing
 * - Preserves aspect ratios to avoid layout shift
 */
export function MasonryGrid({ images, onImageClick, onImageMenuClick, minCardWidth = 220, gap = 12, rowUnit = 8, wideAspectRatio = 1.6, wideSpan = 2, selectionMode = false, selectedIds = new Set(), onToggleSelection, setItemRef, dragAttributes, dragListeners, dragStyle, isDragging = false, dataTestId }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [processedImages, setProcessedImages] = useState<MasonryItem[]>([]);

  // Calculate grid dimensions and update container width
  const gridDimensions = useMemo(() => {
    if (!containerWidth) return { columns: 1, columnWidth: minCardWidth };

    // Calculate how many columns fit
    const availableWidth = containerWidth - gap; // Account for gap
    const columns = Math.max(1, Math.floor((availableWidth + gap) / (minCardWidth + gap)));
    const columnWidth = Math.max(minCardWidth, (availableWidth - (columns - 1) * gap) / columns);

    return { columns, columnWidth };
  }, [containerWidth, minCardWidth, gap]);

  // Process images to calculate grid spans
  const processedImagesMemo = useMemo(() => {
    return images.map((image): MasonryItem => {
      const aspectRatio = image.width && image.height ? image.width / image.height : 1;
      let gridColumnSpan = 1;

      // Check if image is wide enough to span multiple columns (only on larger screens)
      if (gridDimensions.columns >= 3 && aspectRatio >= wideAspectRatio) {
        gridColumnSpan = wideSpan;
      }

      // Calculate approximate row span based on aspect ratio
      // This provides an initial estimate, but CSS Grid will handle the final positioning
      const estimatedHeight = (gridDimensions.columnWidth * gridColumnSpan) / aspectRatio;
      const gridRowSpan = Math.max(1, Math.ceil(estimatedHeight / rowUnit));

      return {
        ...image,
        aspectRatio,
        gridColumnSpan,
        gridRowSpan
      };
    });
  }, [images, gridDimensions, wideAspectRatio, wideSpan, rowUnit]);

  // Update processed images when they change
  useEffect(() => {
    setProcessedImages(processedImagesMemo);
  }, [processedImagesMemo]);

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
  const sortedImages = useMemo(() => [...processedImages].sort((a, b) => a.position - b.position), [processedImages]);

  if (sortedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Upload images to get started</p>
      </div>
    );
  }

  const gridStyle: CSSProperties = {
    display: "grid",
    gridAutoFlow: "row dense",
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
    gridAutoRows: `${rowUnit}px`,
    gap: `${gap}px`,
    width: "100%",
    alignItems: "start" // Ensure items align to top for masonry effect
  };

  return (
    <div
      ref={containerRef}
      className="w-full"
      data-testid={dataTestId}
    >
      <div style={gridStyle}>
        {sortedImages.map((image) => {
          const itemStyle: CSSProperties = {
            ...(dragStyle ?? {}),
            gridRowEnd: image.gridRowSpan ? `span ${image.gridRowSpan}` : undefined,
            gridColumnEnd: image.gridColumnSpan && image.gridColumnSpan > 1 ? `span ${image.gridColumnSpan}` : undefined,
            // Let ImageGridItem handle aspect ratios naturally
            minHeight: "100px" // Minimum height to prevent too small cards
          };

          return (
            <ImageGridItem
              key={image.id}
              image={image}
              onClick={() => handleImageClick(image)}
              onMenuClick={(e) => onImageMenuClick?.(image, e)}
              setRef={setItemRef ? (node) => setItemRef(image.id, node) : undefined}
              dragAttributes={dragAttributes}
              dragListeners={dragListeners}
              style={itemStyle}
              className={cn(isDragging && "opacity-50")}
              dataTestId={`masonry-item-${image.id}`}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(image.id)}
              onToggleSelection={() => onToggleSelection?.(image.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
