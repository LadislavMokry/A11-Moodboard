import { Skeleton } from './Skeleton';

export function BoardCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="board-card-skeleton"
      style={{ contain: 'layout paint' }}
    >
      {/* Cover Image Skeleton (2x2 grid) */}
      <div className="grid aspect-square grid-cols-2 gap-0.5 bg-neutral-100 dark:bg-neutral-800">
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Card Info Skeleton */}
      <div className="space-y-2 p-4">
        {/* Board name */}
        <Skeleton className="h-6 w-3/4" />

        {/* Meta info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" variant="circle" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
