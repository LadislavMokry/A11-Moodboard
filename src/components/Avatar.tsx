import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/**
 * Generates initials from a name (max 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  src,
  alt = '',
  fallbackText = '',
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const initials = fallbackText ? getInitials(fallbackText) : '?';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-neutral-800 dark:bg-neutral-700',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide image on error to show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-medium text-neutral-100',
          src && 'opacity-0'
        )}
      >
        {initials}
      </span>
    </div>
  );
}
