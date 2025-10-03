interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClassMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-10 w-10 border-4',
};

/**
 * Simple loading spinner with optional message.
 */
export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
      <span
        className={`${sizeClassMap[size]} animate-spin rounded-full border-neutral-300 border-t-transparent dark:border-neutral-700 dark:border-t-transparent`}
        aria-hidden="true"
      />
      {message ? <span className="font-medium text-neutral-600 dark:text-neutral-300">{message}</span> : null}
    </div>
  );
}
