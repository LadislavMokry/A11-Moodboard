import { useState, useEffect, useRef } from 'react';

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
 * - Tiles rotate in sequence: 0, 1, 2, 3, 0, 1, 2, 3...
 * - Full cycle takes ~8s (4 tiles × 2s each)
 */
export function useCoverRotation({
  totalImages,
  paused,
  tileInterval = 2000,
}: UseCoverRotationOptions): number[] {
  // Track rotation count for each tile [tile0, tile1, tile2, tile3]
  const [tileRotations, setTileRotations] = useState([0, 0, 0, 0]);
  const intervalRef = useRef<number | null>(null);
  const rotationCountRef = useRef(0);

  // Calculate current 4 indices based on tile rotations
  const currentIndices = [0, 1, 2, 3].map((tileIndex) => {
    if (totalImages <= 4) {
      // Static display for ≤4 images
      return tileIndex < totalImages ? tileIndex : tileIndex % Math.max(totalImages, 1);
    }

    // Start with base position, then add rotation offset
    return (tileIndex + tileRotations[tileIndex]) % totalImages;
  });

  useEffect(() => {
    // Don't rotate if paused or ≤4 images
    if (paused || totalImages <= 4) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start rotation interval - rotates ONE tile at a time
    intervalRef.current = window.setInterval(() => {
      setTileRotations((prev) => {
        const next = [...prev];
        // Determine which tile to rotate (cycles 0, 1, 2, 3, 0, 1, 2, 3...)
        const tileToRotate = rotationCountRef.current % 4;
        // Increment that tile's rotation count
        next[tileToRotate] = prev[tileToRotate] + 1;
        rotationCountRef.current += 1;
        return next;
      });
    }, tileInterval);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, totalImages, tileInterval]);

  return currentIndices;
}
