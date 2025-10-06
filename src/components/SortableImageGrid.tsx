import { CustomDragOverlay } from "@/components/CustomDragOverlay";
import { SortableImageItemWithMenu } from "@/components/SortableImageItemWithMenu";
import { useImageReorder } from "@/hooks/useImageReorder";
import { type Image } from "@/schemas/image";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragCancelEvent, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
}

function sortImages(images: Image[]): Image[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export function SortableImageGrid({ boardId, images, onImageClick, onEditCaption, onDelete, selectionMode = false, selectedIds = new Set(), onToggleSelection, readOnly = false }: SortableImageGridProps) {
  const [orderedImages, setOrderedImages] = useState<Image[]>(() => sortImages(images));
  const [activeId, setActiveId] = useState<string | null>(null);
  const { queueReorder } = useImageReorder(boardId);
  const imagesKeyRef = useRef<string | null>(null);

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
        delay: 300,
        tolerance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

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

  if (orderedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">{readOnly ? "This board is empty" : "Upload images to get started"}</p>
      </div>
    );
  }

  // Read-only mode: render masonry-style column layout without drag-and-drop
  if (readOnly) {
    return (
      <div
        className="gap-4"
        style={{
          columnWidth: "280px",
          columnGap: "1rem" // 16px to match gap-4
        }}
      >
        {orderedImages.map((image) => (
          <SortableImageItemWithMenu
            key={image.id}
            image={image}
            onClick={onImageClick}
            onEditCaption={onEditCaption}
            onDelete={onDelete}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(image.id)}
            onToggleSelection={() => onToggleSelection?.(image.id)}
          />
        ))}
      </div>
    );
  }

  // Editable mode: full drag-and-drop functionality
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={orderedImages.map((image) => image.id)}>
        <div
          className="gap-4"
          style={{
            columnWidth: "280px",
            columnGap: "1rem" // 16px to match gap-4
          }}
        >
          {orderedImages.map((image) => (
            <SortableImageItemWithMenu
              key={image.id}
              image={image}
              onClick={onImageClick}
              onEditCaption={onEditCaption}
              onDelete={onDelete}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(image.id)}
              onToggleSelection={() => onToggleSelection?.(image.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>{activeImage ? <CustomDragOverlay image={activeImage} /> : null}</DragOverlay>
    </DndContext>
  );
}
