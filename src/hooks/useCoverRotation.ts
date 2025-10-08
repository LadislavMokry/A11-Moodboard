import { useEffect, useRef, useState } from "react";

interface UseCoverRotationOptions {
  /**
   * Total number of images available for rotation
   */
  totalImages: number;
  /**
   * Whether rotation is paused
   */
  paused: boolean;
  /**
   * Interval in milliseconds for each tile rotation (default 2000ms)
   */
  tileInterval?: number;
}

/**
 * Hook to manage rotating board cover state
 * Returns current 4 image indices that cycle through available images
 * with staggered timing (tile 0 changes, then 2s later tile 1, etc.)
 *
 * Rotation pattern:
 * - Each tile rotates individually every ~2s
 * - Tiles rotate in sequence 0 → 1 → 2 → 3 while each tile swaps to a random image
 *   that isn't currently visible in another tile, keeping the grid varied.
 */
export function useCoverRotation({
  totalImages,
  paused,
  tileInterval = 2000,
}: UseCoverRotationOptions): number[] {
  const tileCount = 4;
  const [currentIndices, setCurrentIndices] = useState<number[]>(() => getInitialIndices(totalImages, tileCount));
  const intervalRef = useRef<number | null>(null);
  const rotationCountRef = useRef(0);

  useEffect(() => {
    rotationCountRef.current = 0;
    setCurrentIndices(getInitialIndices(totalImages, tileCount));
  }, [totalImages]);

  const supportsRotation = totalImages > tileCount;

  useEffect(() => {
    // Don't rotate if paused or not enough images
    if (paused || !supportsRotation) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (totalImages === 0) {
      return;
    }

    // Start rotation interval - rotates ONE tile at a time
    intervalRef.current = window.setInterval(() => {
      setCurrentIndices((prev) => {
        const next = [...prev];
        const tileToRotate = rotationCountRef.current % tileCount;
        rotationCountRef.current += 1;

        const otherIndices = new Set(next.filter((_, index) => index !== tileToRotate));
        const availableIndices: number[] = [];

        for (let i = 0; i < totalImages; i += 1) {
          if (!otherIndices.has(i) && i !== next[tileToRotate]) {
            availableIndices.push(i);
          }
        }

        if (availableIndices.length === 0) {
          // Fallback: sequential advance
          next[tileToRotate] = (next[tileToRotate] + 1) % totalImages;
          return next;
        }

        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        next[tileToRotate] = randomIndex;
        return next;
      });
    }, tileInterval);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, supportsRotation, tileInterval, totalImages]);

  return currentIndices;
}

function getInitialIndices(totalImages: number, tileCount: number): number[] {
  if (totalImages <= 0) {
    return Array.from({ length: tileCount }, (_, index) => index);
  }

  if (totalImages <= tileCount) {
    return Array.from({ length: tileCount }, (_, index) => index % totalImages);
  }

  const indices = Array.from({ length: totalImages }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, tileCount);
}
