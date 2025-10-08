import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { type Image } from "@/schemas/image";
import type { DraggableAttributes } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ImageGridItem } from "./ImageGridItem";
import { ImageGridItemWithMenu } from "./ImageGridItemWithMenu";

type SyntheticListenerMap = Record<string, Function> | undefined;

interface BoardMasonryGridProps {
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
  hoverVariant?: "default" | "download";
  onDownload?: (image: Image) => void;
  itemVariant?: "default" | "menu";
  onEditCaption?: (image: Image) => void;
  onDelete?: (image: Image) => void;
  onShare?: (image: Image) => void;
  showMenu?: boolean;
  fitStyle?: "cover" | "contain";
  showSelectionToggle?: boolean;
  useOriginalSrc?: boolean;
  showOverlays?: boolean;
}

interface LayoutItem {
  image: Image;
  rowSpan: number;
  columnSpan: number;
}

/**
 * BoardMasonryGrid - CSS grid based masonry layout for board pages (Savee-style)
 * Renders images uncropped by sizing each cell using the incoming aspect ratio.
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
  dataTestId,
  hoverVariant = "default",
  onDownload,
  itemVariant = "default",
  onEditCaption,
  onDelete,
  onShare,
  showMenu = true,
  fitStyle = "contain",
  showSelectionToggle = true,
  useOriginalSrc = false,
  showOverlays = true,
}: BoardMasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobile = useIsMobile();
  const handleMenuClick = onImageMenuClick ? (image: Image, event: React.MouseEvent) => onImageMenuClick(image, event) : null;

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
    if (isMobile) {
      return 3;
    }

    if (!containerWidth) {
      return 1;
    }

    return Math.max(1, Math.floor(containerWidth / minCardWidth));
  }, [containerWidth, minCardWidth, isMobile]);

  const columnWidth = useMemo(() => {
    if (!containerWidth || columnCount === 0) {
      return minCardWidth;
    }

    const totalGap = gap * Math.max(0, columnCount - 1);
    const usableWidth = containerWidth - totalGap;
    return usableWidth / columnCount;
  }, [containerWidth, columnCount, gap, minCardWidth]);

  const baseRowHeight = useMemo(() => {
    const referenceWidth = columnWidth || minCardWidth;
    return Math.max(8, Math.round(referenceWidth / 6));
  }, [columnWidth, minCardWidth]);

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

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.position - b.position),
    [images]
  );

  const layoutItems: LayoutItem[] = useMemo(() => {
    if (sortedImages.length === 0) {
      return [];
    }

    return sortedImages.map((image) => {
      const hasDimensions = Boolean(image.width && image.height);
      const aspectRatio = hasDimensions && image.width && image.height ? image.height / image.width : 1;
      const isWide = hasDimensions && image.width && image.height ? image.width / image.height >= 1.4 : false;
      const columnSpan = isWide && columnCount > 1 ? 2 : 1;
      const widthForMath = columnWidth || minCardWidth;
      const effectiveWidth = columnSpan > 1 ? widthForMath * columnSpan + gap * (columnSpan - 1) : widthForMath;
      const targetHeight = effectiveWidth * aspectRatio;
      const rowHeightWithGap = baseRowHeight + gap;
      const safetyPadding = gap * 0.5; // favour extra space to avoid collisions
      const rowSpan = Math.max(
        1,
        Math.ceil((targetHeight + gap + safetyPadding) / (rowHeightWithGap > 0 ? rowHeightWithGap : 1))
      );

      return {
        image,
        rowSpan,
        columnSpan
      };
    });
  }, [sortedImages, columnCount, columnWidth, minCardWidth, gap, baseRowHeight]);

  if (layoutItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Upload images to get started</p>
      </div>
    );
  }

  const containerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: columnCount ? `repeat(${columnCount}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
    gridAutoRows: `${baseRowHeight}px`,
    gridAutoFlow: "row dense",
    gap: `${gap}px`
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="w-full"
      data-testid={dataTestId}
    >
      {layoutItems.map(({ image, rowSpan, columnSpan }) => {
        const style: CSSProperties = {
          ...(dragStyle ?? {}),
          gridRowEnd: `span ${rowSpan}`,
          gridColumnEnd: columnSpan > 1 ? `span ${columnSpan}` : undefined,
          width: "100%"
        };

        if (itemVariant === "menu") {
          return (
            <ImageGridItemWithMenu
              key={image.id}
              image={image}
              onClick={() => handleImageClick(image)}
              onEditCaption={onEditCaption ? () => onEditCaption(image) : undefined}
              onDelete={onDelete ? () => onDelete(image) : undefined}
              setRef={setItemRef ? (node) => setItemRef(image.id, node) : undefined}
              dragAttributes={dragAttributes}
              dragListeners={dragListeners}
              style={style}
              className={cn(isDragging && "opacity-50")}
              dataTestId={`board-masonry-item-${image.id}`}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(image.id)}
              onToggleSelection={onToggleSelection ? () => onToggleSelection(image.id) : undefined}
              hoverVariant={hoverVariant}
              onDownload={onDownload ? () => onDownload(image) : undefined}
              onShare={onShare ? () => onShare(image) : undefined}
              fitStyle={fitStyle}
              showMenu={showMenu}
              useOriginalSrc={useOriginalSrc}
              showSelectionToggle={showSelectionToggle}
              showOverlays={showOverlays}
            />
          );
        }

        return (
          <ImageGridItem
            key={image.id}
            image={image}
            onClick={() => handleImageClick(image)}
            onMenuClick={handleMenuClick ? (event) => handleMenuClick(image, event) : undefined}
            setRef={setItemRef ? (node) => setItemRef(image.id, node) : undefined}
            dragAttributes={dragAttributes}
            dragListeners={dragListeners}
            style={style}
            className={cn(isDragging && "opacity-50")}
            dataTestId={`board-masonry-item-${image.id}`}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(image.id)}
            onToggleSelection={onToggleSelection ? () => onToggleSelection(image.id) : undefined}
            fitStyle={fitStyle}
            hoverVariant={hoverVariant}
            onDownload={hoverVariant === "download" && onDownload ? () => onDownload(image) : undefined}
            useOriginalSrc={useOriginalSrc}
            showSelectionToggle={showSelectionToggle}
            showOverlays={showOverlays}
          />
        );
      })}
    </div>
  );
}
