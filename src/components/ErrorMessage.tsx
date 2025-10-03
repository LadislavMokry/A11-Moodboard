import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  error: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Displays an error message with optional retry button.
 */
export function ErrorMessage({ error, onRetry, retryLabel = 'Retry' }: ErrorMessageProps) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400"
    >
      <div className="flex items-center gap-2 font-medium text-red-300">
        <AlertCircle aria-hidden="true" className="h-5 w-5" />
        <span>Something went wrong</span>
      </div>
      <p className="text-red-200">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="border-red-400/40 text-red-200 hover:bg-red-500/10 hover:text-red-100"
        >
          <RotateCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
