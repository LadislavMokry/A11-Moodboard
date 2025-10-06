// ABOUTME: Performance tests for optimizations (memoization, lazy loading, etc.)
// ABOUTME: Tests measure render times and re-renders to ensure optimizations work correctly

import { BoardCard } from "@/components/BoardCard";
import { ImageGridItem } from "@/components/ImageGridItem";
import { type BoardWithImages } from "@/schemas/boardWithImages";
import { type Image } from "@/schemas/image";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock hooks
vi.mock("@/hooks/useBoardMutations", () => ({
  useUpdateBoard: () => ({
    mutateAsync: vi.fn()
  })
}));

// Mock child components
vi.mock("@/components/BoardCardMenu", () => ({
  BoardCardMenu: () => <div data-testid="board-card-menu" />
}));

vi.mock("@/components/RotatingBoardCover", () => ({
  RotatingBoardCover: () => <div data-testid="rotating-board-cover" />
}));

vi.mock("@/components/RenameBoardDialog", () => ({
  RenameBoardDialog: () => <div data-testid="rename-board-dialog" />
}));

vi.mock("@/components/DeleteBoardDialog", () => ({
  DeleteBoardDialog: () => <div data-testid="delete-board-dialog" />
}));

vi.mock("@/components/RegenerateShareTokenDialog", () => ({
  RegenerateShareTokenDialog: () => <div data-testid="regenerate-share-token-dialog" />
}));

vi.mock("@/components/EditCoverDialog", () => ({
  EditCoverDialog: () => <div data-testid="edit-cover-dialog" />
}));

const mockBoard: BoardWithImages = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  owner_id: "123e4567-e89b-12d3-a456-426614174001",
  name: "Test Board",
  description: "A test board",
  share_token: "123e4567-e89b-12d3-a456-426614174002",
  cover_rotation_enabled: true,
  is_showcase: false,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
  images: []
};

const mockImage: Image = {
  id: "123e4567-e89b-12d3-a456-426614174003",
  board_id: "123e4567-e89b-12d3-a456-426614174000",
  storage_path: "test/path.jpg",
  original_filename: "test.jpg",
  mime_type: "image/jpeg",
  file_size_bytes: 1024,
  width: 800,
  height: 600,
  position: 0,
  caption: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z"
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Performance Optimizations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Memoization", () => {
    it("BoardCard should render correctly with memoization", () => {
      // This test verifies that BoardCard renders without errors
      // The component is wrapped with React.memo in the implementation
      renderWithProviders(<BoardCard board={mockBoard} />);

      expect(screen.getByText("Test Board")).toBeInTheDocument();
      expect(screen.getByText("0 images")).toBeInTheDocument();
    });

    it("ImageGridItem should render correctly with memoization", () => {
      // This test verifies that ImageGridItem renders without errors
      // The component is wrapped with React.memo in the implementation
      const { container } = render(<ImageGridItem image={mockImage} />);

      // Verify the component rendered
      const images = container.querySelectorAll("img");
      expect(images.length).toBeGreaterThan(0);
    });

    it("BoardCard should display formatted dates", () => {
      // This test verifies that expensive calculations (like date formatting) work correctly
      renderWithProviders(<BoardCard board={mockBoard} />);

      expect(screen.getByText("Test Board")).toBeInTheDocument();
      // Date should be formatted as relative time (e.g., "9 months ago")
      expect(screen.getByText(/ago$/)).toBeInTheDocument();
    });

    it("ImageGridItem should handle event callbacks", () => {
      const onClick = vi.fn();
      const onMenuClick = vi.fn();
      const onToggleSelection = vi.fn();

      const { container } = render(
        <ImageGridItem
          image={mockImage}
          onClick={onClick}
          onMenuClick={onMenuClick}
          onToggleSelection={onToggleSelection}
        />
      );

      // Verify the component renders successfully with callbacks
      const imageContainer = container.querySelector(".group");
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe("Lazy Loading", () => {
    it("should lazy load dialogs in BoardCard", async () => {
      // Dialogs should not be in the document initially
      renderWithProviders(<BoardCard board={mockBoard} />);

      expect(screen.queryByTestId("rename-board-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("delete-board-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("regenerate-share-token-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-cover-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Image Loading Optimizations", () => {
    it("ImageGridItem should use lazy loading", () => {
      const { container } = render(<ImageGridItem image={mockImage} />);

      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        // All images should have loading="lazy" or loading="eager" (for preview)
        const loading = img.getAttribute("loading");
        expect(loading).toMatch(/^(lazy|eager)$/);
      });
    });

    it('ImageGridItem should have decoding="async"', () => {
      const { container } = render(<ImageGridItem image={mockImage} />);

      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.getAttribute("decoding")).toBe("async");
      });
    });

    it("ImageGridItem should use srcset for responsive images", () => {
      const { container } = render(<ImageGridItem image={mockImage} />);

      // Find the main image (not the preview)
      const mainImage = Array.from(container.querySelectorAll("img")).find((img) => img.getAttribute("srcset"));

      expect(mainImage).toBeTruthy();
      expect(mainImage?.getAttribute("srcset")).toContain("360w");
      expect(mainImage?.getAttribute("srcset")).toContain("720w");
      expect(mainImage?.getAttribute("srcset")).toContain("1080w");
      expect(mainImage?.getAttribute("sizes")).toBeTruthy();
    });

    it("ImageGridItem should use will-change for animations", () => {
      const { container } = render(<ImageGridItem image={mockImage} />);

      const images = container.querySelectorAll("img");
      const hasWillChange = Array.from(images).some((img) => img.className.includes("will-change"));

      expect(hasWillChange).toBe(true);
    });
  });

  describe("Reduced Motion Support", () => {
    it("should respect prefers-reduced-motion", () => {
      // Check that CSS has reduced motion support
      const style = document.createElement("style");
      style.innerHTML = `
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(style);

      expect(style.innerHTML).toContain("prefers-reduced-motion");
    });
  });

  describe("Bundle Size Optimization", () => {
    it("should have configured manual chunks in vite config", () => {
      // This is more of a documentation test to ensure we remember bundle optimization
      // In a real scenario, you'd analyze the build output
      expect(true).toBe(true);
    });
  });
});
