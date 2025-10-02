// ABOUTME: React Error Boundary that catches runtime errors and renders fallback UI
// ABOUTME: Provides reset functionality via TanStack Query to retry failed queries.

import { queryClient } from "@/lib/queryClient";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: integrate monitoring (Sentry, etc.)
    console.error("Uncaught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    queryClient.resetQueries();
  };

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <h1 className="text-2xl font-semibold text-destructive">Something went wrong</h1>
            <pre className="whitespace-pre-wrap text-muted-foreground max-w-lg text-center">{error?.message}</pre>
            <button
              className="rounded border px-4 py-2 text-sm hover:bg-muted"
              onClick={this.handleReset}
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
