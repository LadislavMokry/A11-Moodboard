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
  style?: CSSProperties;
  hoverVariant?: "default" | "download";
  onDownload?: (image: Image) => void;
  onShare?: (image: Image) => void;
  fitStyle?: "cover" | "contain";
}

export function SortableImageItemWithMenu({
  image,
  onClick,
  onEditCaption,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
  style: layoutStyle,
  hoverVariant = "default",
  onDownload,
  onShare,
  fitStyle = "cover",
}: SortableImageItemWithMenuProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const baseStyle = useMemo<CSSProperties>(() => {
    const transformValue = transform ? CSS.Transform.toString(transform) : undefined;
    return {
      transform: transformValue,
      transition: transition ?? undefined,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 30 : undefined,
      willChange: transform ? 'transform' : undefined,
      touchAction: 'none' as const,
      cursor: isDragging ? 'grabbing' : 'grab'
    };
  }, [isDragging, transform, transition]);

  const combinedStyle = useMemo<CSSProperties>(() => ({
    ...(layoutStyle ?? {}),
    ...baseStyle
  }), [layoutStyle, baseStyle]);

  return (
    <ImageGridItemWithMenu
      image={image}
      onClick={() => onClick?.(image)}
      onEditCaption={() => onEditCaption?.(image)}
      onDelete={() => onDelete?.(image)}
      setRef={setNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
      style={combinedStyle}
      isDragging={isDragging}
      dataTestId={`sortable-image-card-${image.id}`}
      selectionMode={selectionMode}
      isSelected={isSelected}
      onToggleSelection={onToggleSelection}
      useOriginalSrc
      hoverVariant={hoverVariant}
      onDownload={onDownload ? () => onDownload(image) : undefined}
      onShare={onShare ? () => onShare(image) : undefined}
      fitStyle={fitStyle}
    />
  );
}
