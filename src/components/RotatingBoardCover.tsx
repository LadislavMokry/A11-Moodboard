import { useCoverRotation } from "@/hooks/useCoverRotation";
import { getSupabaseThumbnail } from "@/lib/imageUtils";
import { type Image } from "@/schemas/image";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface RotatingBoardCoverProps {
  /**
   * Board images to display
   */
  images: Image[];
  /**
   * Board name for alt text
   */
  boardName: string;
  /**
   * Whether cover rotation is enabled
   */
  rotationEnabled: boolean;
  /**
   * Custom cover image IDs (if set)
   */
  coverImageIds?: string[];
}

/**
 * Animated 2×2 board cover with rotating thumbnails
 * - Static display for ≤4 images
 * - Rotating crossfade animation for >4 images
 * - Pauses on hover
 * - Respects rotationEnabled setting
 */
export function RotatingBoardCover({ images, boardName, rotationEnabled, coverImageIds }: RotatingBoardCoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter images to cover pool (either custom or all images)
  const coverImages = coverImageIds && coverImageIds.length > 0 ? images.filter((img) => coverImageIds.includes(img.id)) : images;

  // Determine if rotation should be paused
  const shouldPause = isHovered || !rotationEnabled || (isMobile && !rotationEnabled);

  // Get rotating indices
  const currentIndices = useCoverRotation({
    totalImages: coverImages.length,
    paused: shouldPause,
    tileInterval: 2000
  });

  // Empty state
  if (coverImages.length === 0) {
    return (
      <div
        className="grid aspect-square grid-cols-2 gap-1 bg-neutral-100 p-1 dark:bg-neutral-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="col-span-2 row-span-2 flex items-center justify-center">
          <ImageIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid aspect-square grid-cols-2 gap-1 bg-neutral-100 p-1 dark:bg-neutral-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {[0, 1, 2, 3].map((tileIndex) => {
        const imageIndex = currentIndices[tileIndex];
        const image = coverImages[imageIndex];

        // Handle case where we have fewer images than tiles
        if (!image) {
          return (
            <div
              key={tileIndex}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-700"
            />
          );
        }

        return (
          <div
            key={tileIndex}
            className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-700"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={`${tileIndex}-${image.id}`}
                src={getSupabaseThumbnail(image.storage_path, 360)}
                alt={image.caption || boardName}
                className="h-full w-full object-cover will-change-opacity"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
