import { type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'rect',
  className,
}: SkeletonProps) {
  const style: CSSProperties = {
    contain: 'layout paint',
  };

  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 bg-[length:200%_100%] animate-shimmer',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-md',
        variant === 'text' && 'h-4 rounded',
        className,
      )}
      style={style}
      aria-hidden="true"
      data-testid="skeleton"
    />
  );
}
