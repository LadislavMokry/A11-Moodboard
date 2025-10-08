import { BoardMasonryGrid } from "@/components/BoardMasonryGrid";
import { CustomDragOverlay } from "@/components/CustomDragOverlay";
import { ImageGrid } from "@/components/ImageGrid";
import { SortableImageItemWithMenu } from "@/components/SortableImageItemWithMenu";
import { useImageReorder } from "@/hooks/useImageReorder";
import { useIsMobile } from "@/hooks/useIsMobile";
import { copyToClipboard } from "@/lib/clipboard";
import { downloadImage } from "@/lib/download";
import { getSupabasePublicUrl } from "@/lib/imageUtils";
import { type Image } from "@/schemas/image";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragCancelEvent, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface SortableImageGridProps {
  boardId: string | undefined;
  images: Image[];
  onImageClick?: (image: Image) => void;
  onEditCaption?: (image: Image) => void;
  onDelete?: (image: Image) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (imageId: string) => void;
  readOnly?: boolean;
  dragEnabled?: boolean;
  showImageMenus?: boolean;
}

function sortImages(images: Image[]): Image[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export function SortableImageGrid({
  boardId,
  images,
  onImageClick,
  onEditCaption,
  onDelete,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  readOnly = false,
  dragEnabled = true,
  showImageMenus = true,
}: SortableImageGridProps) {
  const [orderedImages, setOrderedImages] = useState<Image[]>(() => sortImages(images));
  const [activeId, setActiveId] = useState<string | null>(null);
  const { queueReorder } = useImageReorder(boardId);
  const imagesKeyRef = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    const sorted = sortImages(images);
    const key = sorted.map((image) => `${image.id}:${image.position}`).join("|");

    if (imagesKeyRef.current === key) {
      return;
    }

    imagesKeyRef.current = key;
    setOrderedImages(sorted);
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 2000,
        tolerance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDownloadImage = useCallback(
    async (image: Image) => {
      const url = getSupabasePublicUrl(image.storage_path);
      const filename = image.original_filename || `${image.id}.jpg`;

      if (isTouchDevice) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      try {
        await downloadImage(url, filename);
        toast.success("Download started");
      } catch (error) {
        console.error("Failed to download image:", error);
        toast.error("Failed to download image");
      }
    },
    [isTouchDevice]
  );

  const handleShareImage = useCallback(async (image: Image) => {
    const url = getSupabasePublicUrl(image.storage_path);
    const title = image.caption || image.original_filename || "Image";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.warn("Share failed, falling back to copy:", error);
      }
    }

    try {
      await copyToClipboard(url);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy image link:", error);
      toast.error("Failed to copy link");
    }
  }, []);

  const activeImage = useMemo(() => (activeId ? orderedImages.find((image) => image.id === activeId) ?? null : null), [activeId, orderedImages]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);

    // Haptic feedback on drag start (if supported)
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      setOrderedImages((current) => {
        const oldIndex = current.findIndex((item) => item.id === active.id);
        const newIndex = current.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) {
          return current;
        }

        const moved = arrayMove(current, oldIndex, newIndex);
        const updated = moved.map((image, index) => ({
          ...image,
          position: index + 1
        }));

        queueReorder({
          imageId: String(active.id),
          newIndex,
          updatedImages: updated
        });

        return updated;
      });
    },
    [queueReorder]
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(node);
    setContainerWidth(node.offsetWidth);

    return () => observer.disconnect();
  }, []);

  const minCardWidth = 200;
  const gap = 12;

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

  const layoutMap = useMemo(() => {
    return orderedImages.map((image) => {
      const hasDimensions = Boolean(image.width && image.height);
      const aspectRatio = hasDimensions && image.width && image.height ? image.height / image.width : 1;
      const isWide = hasDimensions && image.width && image.height ? image.width / image.height >= 1.4 : false;
      const spanColumns = isWide && columnCount > 1 ? 2 : 1;
      const widthForMath = columnWidth || minCardWidth;
      const effectiveWidth = spanColumns > 1 ? widthForMath * spanColumns + gap * (spanColumns - 1) : widthForMath;
      const targetHeight = effectiveWidth * aspectRatio;
      const rowHeightWithGap = baseRowHeight + gap;
      const safetyPadding = gap * 0.5;
      const spanRows = Math.max(
        1,
        Math.ceil((targetHeight + gap + safetyPadding) / (rowHeightWithGap > 0 ? rowHeightWithGap : 1))
      );

      return {
        rowSpan: spanRows,
        columnSpan: spanColumns
      };
    });
  }, [orderedImages, columnCount, columnWidth, baseRowHeight, gap, minCardWidth]);

  if (orderedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">{readOnly ? "This board is empty" : "Upload images to get started"}</p>
      </div>
    );
  }

  let content = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={orderedImages.map((image) => image.id)}>
        <div
          ref={gridRef}
          className="w-full"
          style={{
            display: "grid",
            gap: `${gap}px`,
            gridTemplateColumns: columnCount ? `repeat(${columnCount}, minmax(0, 1fr))` : "repeat(1, minmax(0, 1fr))",
            gridAutoRows: `${baseRowHeight}px`,
            gridAutoFlow: "row dense"
          }}
        >
          {orderedImages.map((image, index) => {
            const layout = layoutMap[index];
            const layoutStyle = {
              gridRowEnd: `span ${layout.rowSpan}`,
              gridColumnEnd: layout.columnSpan > 1 ? `span ${layout.columnSpan}` : undefined,
              width: "100%"
            } as const;

            return (
              <SortableImageItemWithMenu
                key={image.id}
                image={image}
                onClick={onImageClick}
                onEditCaption={onEditCaption}
                onDelete={onDelete}
                onShare={showImageMenus ? handleShareImage : undefined}
                onDownload={showImageMenus ? handleDownloadImage : undefined}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(image.id)}
                onToggleSelection={() => onToggleSelection?.(image.id)}
                style={layoutStyle}
                fitStyle="contain"
                showMenu={showImageMenus}
              />
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>{activeImage ? <CustomDragOverlay image={activeImage} /> : null}</DragOverlay>
    </DndContext>
  );

  if (!dragEnabled) {
    content = (
      <BoardMasonryGrid
        images={orderedImages}
        onImageClick={onImageClick}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelection={onToggleSelection}
        hoverVariant="default"
      />
    );
  }

  if (readOnly) {
    content = (
      <ImageGrid
        images={orderedImages}
        onImageClick={onImageClick}
      />
    );
  }

  return content;
}
