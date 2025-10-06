// ABOUTME: React Error Boundary that catches runtime errors and renders fallback UI
// ABOUTME: Provides reset functionality via TanStack Query to retry failed queries.

import { queryClient } from "@/lib/queryClient";
import { AlertCircle, Ban, FileQuestion, ServerCrash } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Helper to determine error type from error message or custom properties
function getErrorType(error?: Error): {
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  showRetry: boolean;
} {
  if (!error) {
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred. Please try again.",
      icon: AlertCircle,
      showRetry: true
    };
  }

  const errorMessage = error.message.toLowerCase();

  // 404 Not Found
  if (errorMessage.includes("not found") || errorMessage.includes("404")) {
    return {
      title: "Not Found",
      message: "The page or resource you're looking for doesn't exist.",
      icon: FileQuestion,
      showRetry: false
    };
  }

  // 403 Forbidden / Access Denied
  if (errorMessage.includes("forbidden") || errorMessage.includes("access denied") || errorMessage.includes("403") || errorMessage.includes("unauthorized")) {
    return {
      title: "Access Denied",
      message: "You don't have permission to access this resource.",
      icon: Ban,
      showRetry: false
    };
  }

  // 500 Server Error
  if (errorMessage.includes("server error") || errorMessage.includes("500") || errorMessage.includes("internal error")) {
    return {
      title: "Server Error",
      message: "Something went wrong on our end. Please try again in a moment.",
      icon: ServerCrash,
      showRetry: true
    };
  }

  // Network Error
  if (errorMessage.includes("network") || errorMessage.includes("fetch failed")) {
    return {
      title: "Connection Error",
      message: "Unable to connect. Please check your internet connection and try again.",
      icon: AlertCircle,
      showRetry: true
    };
  }

  // Default error
  return {
    title: "Something went wrong",
    message: error.message || "An unexpected error occurred. Please try again.",
    icon: AlertCircle,
    showRetry: true
  };
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
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorInfo = getErrorType(error);
      const Icon = errorInfo.icon;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-10 px-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <Icon className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center space-y-2 max-w-lg">
            <h1 className="text-2xl font-semibold">{errorInfo.title}</h1>
            <p className="text-sm text-muted-foreground">{errorInfo.message}</p>
          </div>
          {errorInfo.showRetry && (
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={this.handleReset}
            >
              Try again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
