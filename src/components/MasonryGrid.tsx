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
  minCardWidth?: number;
  gap?: number;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (imageId: string) => void;
  setItemRef?: (imageId: string, node: HTMLDivElement | null) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  dragStyle?: CSSProperties;
  isDragging?: boolean;
  dataTestId?: string;
  maxHeight?: string;
  alternatingDirection?: boolean;
  readOnly?: boolean;
  fitStyle?: "cover" | "contain";
  minItemHeight?: number;
  columnCountOverride?: number;
}

/**
 * WaterfallMasonryGrid - Creates a Pinterest-style waterfall layout
 */
export function MasonryGrid({
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
  dataTestId,
  maxHeight = "100%",
  alternatingDirection = true,
  readOnly = false,
  fitStyle = "cover",
  minItemHeight,
  columnCountOverride,
}: MasonryGridProps) {
  console.log("MasonryGrid: Rendering", {
    imageCount: images.length,
    minCardWidth,
    gap,
    selectionMode,
    isDragging,
    maxHeight,
    alternatingDirection,
    readOnly,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const columnCount = useMemo(() => {
    if (typeof columnCountOverride === "number") {
      return columnCountOverride;
    }

    if (!containerWidth) return 2;
    const columns = Math.max(1, Math.floor(containerWidth / minCardWidth));
    const count = Math.min(columns, 6);
    console.log("MasonryGrid: Calculated columnCount", { containerWidth, minCardWidth, count });
    return count;
  }, [columnCountOverride, containerWidth, minCardWidth]);

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

  const handleImageClick = useCallback(
    (image: Image) => {
      if (readOnly) {
        onImageClick?.(image);
        return;
      }

      if (selectionMode && onToggleSelection) {
        onToggleSelection(image.id);
      } else if (onImageClick) {
        onImageClick(image);
      }
    },
    [readOnly, selectionMode, onToggleSelection, onImageClick],
  );

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

  const columns: Image[][] = Array.from({ length: columnCount }, () => []);

  sortedImages.forEach((image, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(image);
  });
  console.log("MasonryGrid: Distributed images into columns", { columnCount, columns });

  const containerStyle: CSSProperties = {
    height: maxHeight,
    maxHeight,
    overflow: "hidden",
    display: "flex",
    gap: `${gap}px`,
  };

  const columnStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: `${gap}px`,
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="w-full"
      data-testid={dataTestId}
    >
      {columns.map((columnImages, columnIndex) => {
        const isReversed = alternatingDirection && columnIndex % 2 === 1;

        return (
          <div
            key={columnIndex}
            style={{
              ...columnStyle,
              flexDirection: isReversed ? "column-reverse" : "column",
            }}
            className={cn(
              "waterfall-column",
              isReversed && "flex-col-reverse",
              isReversed ? "showcase-column-down" : "showcase-column-up",
            )}
          >
            {[...columnImages, ...columnImages, ...columnImages, ...columnImages].map((image, index) => (
              <ImageGridItem
                key={`${image.id}-${index}`}
                image={image}
                onClick={() => handleImageClick(image)}
                onMenuClick={readOnly ? undefined : (e) => onImageMenuClick?.(image, e)}
                setRef={setItemRef ? (node) => setItemRef(image.id, node) : undefined}
                dragAttributes={dragAttributes}
                dragListeners={dragListeners}
                style={{
                  ...(dragStyle ?? {}),
                  flexShrink: 0,
                  width: "100%",
                  height: "auto",
                  minHeight: minItemHeight ? `${minItemHeight}px` : undefined,
                }}
                className={cn(isDragging && "opacity-50")}
                dataTestId={`waterfall-item-${image.id}`}
                selectionMode={!readOnly && selectionMode}
                isSelected={!readOnly && selectedIds.has(image.id)}
                onToggleSelection={readOnly ? undefined : () => onToggleSelection?.(image.id)}
                showOverlays={!readOnly}
                fitStyle={fitStyle}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
