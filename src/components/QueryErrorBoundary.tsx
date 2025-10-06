// ABOUTME: TanStack Query-specific error boundary that catches query errors and provides retry functionality
// ABOUTME: Shows user-friendly error messages with retry button to refetch failed queries.

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export function QueryErrorBoundary({ children, fallbackMessage = "Failed to load data" }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">{fallbackMessage}</h2>
                <p className="text-sm text-muted-foreground max-w-md">Something went wrong while loading this content. Please try again.</p>
              </div>
              <button
                onClick={reset}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try again
              </button>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
