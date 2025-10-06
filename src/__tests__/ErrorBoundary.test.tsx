import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock queryClient
vi.mock("@/lib/queryClient", () => ({
  queryClient: {
    resetQueries: vi.fn()
  }
}));

// Component that throws an error
function ThrowError({ error }: { error: Error }) {
  throw error;
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders fallback UI when error is caught", () => {
    const error = new Error("Test error");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("shows 404 error message for not found errors", () => {
    const error = new Error("Resource not found");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Not Found")).toBeInTheDocument();
    expect(screen.getByText("The page or resource you're looking for doesn't exist.")).toBeInTheDocument();
  });

  it("shows 404 error for 404 status code", () => {
    const error = new Error("Error 404: Page not found");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("shows access denied message for 403 errors", () => {
    const error = new Error("403 Forbidden");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this resource.")).toBeInTheDocument();
  });

  it("shows access denied for unauthorized errors", () => {
    const error = new Error("Unauthorized access");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("shows server error message for 500 errors", () => {
    const error = new Error("500 Internal Server Error");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Server Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong on our end. Please try again in a moment.")).toBeInTheDocument();
  });

  it("shows connection error for network errors", () => {
    const error = new Error("Network request failed");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Connection Error")).toBeInTheDocument();
    expect(screen.getByText("Unable to connect. Please check your internet connection and try again.")).toBeInTheDocument();
  });

  it("shows try again button for retryable errors", () => {
    const error = new Error("Test error");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("hides try again button for 404 errors", () => {
    const error = new Error("Not found");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("hides try again button for 403 errors", () => {
    const error = new Error("Forbidden");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("resets error state and calls resetQueries when try again is clicked", () => {
    const error = new Error("Test error");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const tryAgainButton = screen.getAllByRole("button", { name: /try again/i })[0];
    fireEvent.click(tryAgainButton);

    expect(queryClient.resetQueries).toHaveBeenCalledTimes(1);
  });

  it("renders custom fallback when provided", () => {
    const error = new Error("Test error");
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("logs error to console", () => {
    const error = new Error("Test error");
    const consoleErrorSpy = vi.spyOn(console, "error");

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
