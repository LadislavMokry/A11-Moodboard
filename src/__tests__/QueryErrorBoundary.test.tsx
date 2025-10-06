import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Component that throws an error
function ThrowError() {
  throw new Error("Test query error");
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe("QueryErrorBoundary", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    // Suppress console.error in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  function renderWithQueryClient(ui: React.ReactElement) {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  }

  it("renders children when there is no error", () => {
    renderWithQueryClient(
      <QueryErrorBoundary>
        <NormalComponent />
      </QueryErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders default fallback message when error occurs", () => {
    renderWithQueryClient(
      <QueryErrorBoundary>
        <ThrowError />
      </QueryErrorBoundary>
    );

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong while loading this content. Please try again.")).toBeInTheDocument();
  });

  it("renders custom fallback message when provided", () => {
    renderWithQueryClient(
      <QueryErrorBoundary fallbackMessage="Custom error message">
        <ThrowError />
      </QueryErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("shows try again button in fallback UI", () => {
    renderWithQueryClient(
      <QueryErrorBoundary>
        <ThrowError />
      </QueryErrorBoundary>
    );

    // Use getAllByRole to handle StrictMode double-rendering
    expect(screen.getAllByRole("button", { name: /try again/i })[0]).toBeInTheDocument();
  });

  it("shows alert icon in fallback UI", () => {
    const { container } = renderWithQueryClient(
      <QueryErrorBoundary>
        <ThrowError />
      </QueryErrorBoundary>
    );

    // Check for the icon container
    const iconContainer = container.querySelector(".bg-destructive\\/10");
    expect(iconContainer).toBeInTheDocument();
  });

  it("renders with proper styling classes", () => {
    const { container } = renderWithQueryClient(
      <QueryErrorBoundary>
        <ThrowError />
      </QueryErrorBoundary>
    );

    // Check for main container classes
    const mainContainer = container.querySelector(".flex.flex-col.items-center.justify-center");
    expect(mainContainer).toBeInTheDocument();
  });
});
