import { useMemo, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Image } from '@/schemas/image';
import { ImageGridItemWithMenu } from '@/components/ImageGridItemWithMenu';

interface SortableImageItemWithMenuProps {
  image: Image;
  onClick?: (image: Image) => void;
  onEditCaption?: (image: Image) => void;
  onDelete?: (image: Image) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function SortableImageItemWithMenu({
  image,
  onClick,
  onEditCaption,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
}: SortableImageItemWithMenuProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = useMemo<CSSProperties>(() => {
    const transformValue = transform ? CSS.Transform.toString(transform) : undefined;
    return {
      transform: transformValue,
      transition: transition ?? undefined,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 30 : undefined,
      willChange: transform ? 'transform' : undefined,
      touchAction: 'none' as const,
      cursor: isDragging ? 'grabbing' : 'grab',
    };
  }, [isDragging, transform, transition]);

  return (
    <ImageGridItemWithMenu
      image={image}
      onClick={() => onClick?.(image)}
      onEditCaption={() => onEditCaption?.(image)}
      onDelete={() => onDelete?.(image)}
      setRef={setNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
      style={style}
      isDragging={isDragging}
      dataTestId={`sortable-image-card-${image.id}`}
      selectionMode={selectionMode}
      isSelected={isSelected}
      onToggleSelection={onToggleSelection}
      useOriginalSrc
    />
  );
}
