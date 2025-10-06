import { MasonryGrid } from "@/components/MasonryGrid";
import { type Image } from "@/schemas/image";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockImages: Image[] = [
  {
    id: "1",
    board_id: "123e4567-e89b-12d3-a456-426614174000",
    storage_path: "boards/123/image1.jpg",
    caption: "First Image",
    position: 1,
    width: 1920,
    height: 1080,
    mime_type: "image/jpeg",
    size_bytes: 1024000,
    original_filename: "image1.jpg",
    source_url: null,
    created_at: "2025-01-01T00:00:00Z"
  },
  {
    id: "2",
    board_id: "123e4567-e89b-12d3-a456-426614174000",
    storage_path: "boards/123/image2.jpg",
    caption: "Second Image",
    position: 2,
    width: 1080,
    height: 1920,
    mime_type: "image/jpeg",
    size_bytes: 1024000,
    original_filename: "image2.jpg",
    source_url: null,
    created_at: "2025-01-01T00:00:00Z"
  },
  {
    id: "3",
    board_id: "123e4567-e89b-12d3-a456-426614174000",
    storage_path: "boards/123/image3.jpg",
    caption: "Wide Image",
    position: 3,
    width: 3000,
    height: 1500,
    mime_type: "image/jpeg",
    size_bytes: 1024000,
    original_filename: "image3.jpg",
    source_url: null,
    created_at: "2025-01-01T00:00:00Z"
  }
];

describe("MasonryGrid", () => {
  it("renders all images in correct order", () => {
    const { container } = render(<MasonryGrid images={mockImages} />);

    const images = container.querySelectorAll("img:not([aria-hidden])");
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute("alt", "First Image");
    expect(images[1]).toHaveAttribute("alt", "Second Image");
    expect(images[2]).toHaveAttribute("alt", "Wide Image");
  });

  it("sorts images by position", () => {
    // Pass images in wrong order
    const unsortedImages = [mockImages[2], mockImages[0], mockImages[1]];
    const { container } = render(<MasonryGrid images={unsortedImages} />);

    const images = container.querySelectorAll("img:not([aria-hidden])");
    expect(images[0]).toHaveAttribute("alt", "First Image");
    expect(images[1]).toHaveAttribute("alt", "Second Image");
    expect(images[2]).toHaveAttribute("alt", "Wide Image");
  });

  it("shows empty state when no images", () => {
    render(<MasonryGrid images={[]} />);

    expect(screen.getByText("No images yet")).toBeInTheDocument();
    expect(screen.getByText("Upload images to get started")).toBeInTheDocument();
  });

  it("calls onImageClick when image is clicked", () => {
    const onImageClick = vi.fn();
    const { container } = render(
      <MasonryGrid
        images={mockImages}
        onImageClick={onImageClick}
      />
    );

    const firstImage = container.querySelectorAll("img:not([aria-hidden])")[0];
    firstImage.closest("div")?.click();

    expect(onImageClick).toHaveBeenCalledWith(mockImages[0]);
  });

  it("calls onImageMenuClick when menu button is clicked", () => {
    const onImageMenuClick = vi.fn();
    const { container } = render(
      <MasonryGrid
        images={mockImages}
        onImageMenuClick={onImageMenuClick}
      />
    );

    const menuButton = container.querySelectorAll('button[aria-label="Image options"]')[0];
    menuButton.click();

    expect(onImageMenuClick).toHaveBeenCalledWith(mockImages[0], expect.any(Object));
  });

  it("renders CSS grid with masonry properties", () => {
    const { container } = render(<MasonryGrid images={mockImages} />);

    const grid = container.querySelector('[style*="grid-auto-flow"]');
    expect(grid).toBeInTheDocument();

    const gridElement = grid as HTMLElement;
    expect(gridElement.style.display).toBe("grid");
    expect(gridElement.style.gridAutoFlow).toBe("row dense");
  });

  it("renders images with lazy loading", () => {
    const { container } = render(<MasonryGrid images={mockImages} />);

    const images = container.querySelectorAll("img:not([aria-hidden])");
    images.forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  it("handles selection mode", () => {
    const onToggleSelection = vi.fn();
    const { container } = render(
      <MasonryGrid
        images={mockImages}
        selectionMode={true}
        selectedIds={new Set(["1"])}
        onToggleSelection={onToggleSelection}
      />
    );

    const firstImage = container.querySelectorAll("img:not([aria-hidden])")[0];
    firstImage.closest("div")?.click();

    expect(onToggleSelection).toHaveBeenCalledWith("1");
  });

  it("applies custom configuration props", () => {
    const { container } = render(
      <MasonryGrid
        images={mockImages}
        minCardWidth={150}
        gap={8}
        wideAspectRatio={2.0}
        wideSpan={3}
      />
    );

    // The grid should be rendered (exact styling is tested via integration)
    const grid = container.querySelector('[style*="grid-auto-flow"]');
    expect(grid).toBeInTheDocument();
  });

  it("handles images without dimensions", () => {
    const imageWithoutDimensions: Image = {
      ...mockImages[0],
      width: null,
      height: null
    };

    const { container } = render(<MasonryGrid images={[imageWithoutDimensions]} />);

    const image = container.querySelector("img:not([aria-hidden])");
    expect(image).toBeInTheDocument();
  });

  it("handles empty captions correctly", () => {
    const imageWithoutCaption: Image = {
      ...mockImages[0],
      caption: null
    };

    const { container } = render(<MasonryGrid images={[imageWithoutCaption]} />);

    const image = container.querySelector("img:not([aria-hidden])");
    expect(image).toHaveAttribute("alt", "");
  });
});
