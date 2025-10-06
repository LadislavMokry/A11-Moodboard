import { getSupabaseThumbnail } from "@/lib/imageUtils";
import { type Image } from "@/schemas/image";
import { AnimatePresence, motion } from "framer-motion"; // Import framer-motion
import { Image as ImageIcon } from "lucide-react"; // Import ImageIcon
import { useEffect, useState } from "react";

interface HorizontalImagePreviewProps {
  images: Image[];
}

export function HorizontalImagePreview({ images }: HorizontalImagePreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 4) return; // No rotation needed if 4 or fewer images

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images]);

  const displayImages = images.length > 0 ? images : Array.from({ length: 4 }).map(() => null);

  return (
    <div className="flex h-full w-full gap-1">
      {Array.from({ length: 4 }).map((_, tileIndex) => {
        const image = displayImages[(currentImageIndex + tileIndex) % images.length];

        if (!image) {
          return (
            <div
              key={tileIndex}
              className="flex-1 h-full bg-neutral-200 dark:bg-neutral-700 rounded-md flex items-center justify-center"
            >
              <ImageIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            </div>
          );
        }

        return (
          <div
            key={tileIndex}
            className="flex-1 h-full overflow-hidden rounded-md relative"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={image.id} // Use image.id as key for AnimatePresence
                src={getSupabaseThumbnail(image.storage_path, 180)}
                alt={image.caption || "Board image"}
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
