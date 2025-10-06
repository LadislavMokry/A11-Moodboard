import { Skeleton } from './Skeleton';

interface ImageGridSkeletonProps {
  count?: number;
}

const DEFAULT_HEIGHTS = [220, 260, 300, 340, 280, 240, 320, 360];

export function ImageGridSkeleton({ count = 6 }: ImageGridSkeletonProps) {
  const heights = Array.from({ length: count }, (_, index) => DEFAULT_HEIGHTS[index % DEFAULT_HEIGHTS.length]);

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3" data-testid="image-grid-skeleton">
      {heights.map((height, index) => (
        <div
          key={index}
          className="mb-4 break-inside-avoid"
          style={{ contain: 'layout paint' }}
        >
          <Skeleton height={height} className="w-full" />
        </div>
      ))}
    </div>
  );
}
