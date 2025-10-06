import { getSupabaseThumbnail } from "@/lib/imageUtils";
import { type Image } from "@/schemas/image";
import { useEffect, useState } from "react"; // Import useEffect and useState
import "@/styles/horizontal-scroll.css"; // Import the new CSS file

interface HorizontalImagePreviewProps {
  images: Image[];
}

export function HorizontalImagePreview({ images }: HorizontalImagePreviewProps) {
  // Duplicate images for infinite scroll effect
  const duplicatedImages = [...images, ...images, ...images, ...images];

  // Calculate animation duration based on number of images
  const [animationDuration, setAnimationDuration] = useState("30s");

  useEffect(() => {
    // Adjust duration based on number of images to maintain consistent speed
    const speedFactor = 5; // Adjust this value to control scroll speed
    const duration = duplicatedImages.length * speedFactor;
    setAnimationDuration(`${duration}s`);
  }, [images]);

  return (
    <div className="flex h-full w-full gap-1 overflow-hidden">
      <div
        className="flex h-full horizontal-scroll-container"
        style={{ animationDuration: animationDuration }}
      >
        {duplicatedImages.map((image, index) => (
          <div key={`${image.id}-${index}`} className="flex-shrink-0 h-full w-20 overflow-hidden rounded-md">
            <img
              src={getSupabaseThumbnail(image.storage_path, 180)}
              alt={image.caption || "Board image"}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
      {Array.from({ length: 4 - images.slice(0,4).length }).map((_, i) => (
        <div key={`placeholder-${i}`} className="flex-1 h-full bg-neutral-200 dark:bg-neutral-700 rounded-md" />
      ))}
    </div>
  );
}