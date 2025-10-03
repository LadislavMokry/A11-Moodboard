import { useMemo, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Image } from '@/schemas/image';
import { ImageGridItem } from '@/components/ImageGridItem';

interface SortableImageItemProps {
  image: Image;
  onClick?: (image: Image) => void;
  onMenuClick?: (image: Image, event: React.MouseEvent) => void;
}

export function SortableImageItem({ image, onClick, onMenuClick }: SortableImageItemProps) {
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
    <ImageGridItem
      image={image}
      onClick={() => onClick?.(image)}
      onMenuClick={(event) => onMenuClick?.(image, event)}
      setRef={setNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
      style={style}
      isDragging={isDragging}
      dataTestId={`sortable-image-card-${image.id}`}
    />
  );
}
