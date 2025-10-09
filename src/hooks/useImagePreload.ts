import { useEffect } from 'react';
import { getSupabasePublicUrl } from '@/lib/imageUtils';
import type { Image } from '@/schemas/image';

/**
 * Preloads images by creating hidden Image objects
 * Helps prevent loading states when navigating quickly through lightbox
 */
export function useImagePreload(images: Image[], currentIndex: number, preloadCount = 2) {
  useEffect(() => {
    const imagesToPreload: string[] = [];

    // Preload next images
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < images.length) {
        const url = getSupabasePublicUrl(images[nextIndex].storage_path);
        if (url) imagesToPreload.push(url);
      }
    }

    // Preload previous images
    for (let i = 1; i <= preloadCount; i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0) {
        const url = getSupabasePublicUrl(images[prevIndex].storage_path);
        if (url) imagesToPreload.push(url);
      }
    }

    // Create Image objects to trigger browser preloading
    const imageObjects = imagesToPreload.map((url) => {
      const img = new window.Image();
      img.src = url;
      return img;
    });

    // Cleanup function (though Image objects will naturally be GC'd)
    return () => {
      imageObjects.forEach((img) => {
        img.src = '';
      });
    };
  }, [images, currentIndex, preloadCount]);
}
