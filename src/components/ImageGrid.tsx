import { type Image } from "@/schemas/image";
import { BoardMasonryGrid } from "./BoardMasonryGrid";
import { ImageGridItem } from "./ImageGridItem";

interface ImageGridProps {
  images: Image[];
  onImageClick?: (image: Image) => void;
  onImageMenuClick?: (image: Image, event: React.MouseEvent) => void;
  hoverVariant?: "default" | "download";
  onDownload?: (image: Image) => void;
}

export function ImageGrid({ images, onImageClick, onImageMenuClick, hoverVariant = "default", onDownload }: ImageGridProps) {
  // Feature flag to enable/disable masonry layout (can be toggled via environment variable)
  const enableMasonry = import.meta.env.VITE_ENABLE_MASONRY === "true";

  if (enableMasonry) {
    return (
      <BoardMasonryGrid
        images={images}
        onImageClick={onImageClick}
        onImageMenuClick={onImageMenuClick}
        minCardWidth={200} // Smaller cards like Savee
        gap={12} // Tighter gutters
        hoverVariant={hoverVariant}
        onDownload={onDownload}
      />
    );
  }

  // Fallback to original CSS columns layout
  const sortedImages = [...images].sort((a, b) => a.position - b.position);

  if (sortedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No images yet</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Upload images to get started</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
      {sortedImages.map((image) => (
        <ImageGridItem
          key={image.id}
          image={image}
          onClick={() => onImageClick?.(image)}
          onMenuClick={(e) => onImageMenuClick?.(image, e)}
          hoverVariant={hoverVariant}
          onDownload={hoverVariant === "download" ? () => onDownload?.(image) : undefined}
        />
      ))}
    </div>
  );
}
