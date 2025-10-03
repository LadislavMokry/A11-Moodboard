import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Generic empty state view with optional action.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-muted-foreground" aria-hidden="true">
        {icon}
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
