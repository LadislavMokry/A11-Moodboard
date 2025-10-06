import { Skeleton } from './Skeleton';
import { X } from 'lucide-react';

export function LightboxSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      aria-hidden="true"
      data-testid="lightbox-skeleton"
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
        disabled
      >
        <X className="h-6 w-6" />
      </button>

      {/* Main image skeleton - centered */}
      <div className="flex h-full w-full items-center justify-center p-8">
        <Skeleton className="aspect-[4/3] max-h-[80vh] max-w-[90vw]" />
      </div>

      {/* Desktop thumbnail strip skeleton (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 hidden gap-2 p-4 md:flex">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-20 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}
