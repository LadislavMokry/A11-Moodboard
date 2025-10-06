import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageGridItem } from "@/components/ImageGridItem";
import { type Image } from "@/schemas/image";

vi.mock("@/lib/imageUtils", () => ({
  getSupabaseThumbnail: vi.fn((path: string, size: number) => `${path}?w=${size}`),
  getSupabasePublicUrl: vi.fn((path: string) => `https://cdn.example.com/${path}`),
}));

const baseImage: Image = {
  id: "img-1",
  board_id: "board-1",
  storage_path: "boards/board-1/image.jpg",
  caption: "Progressive Image",
  position: 1,
  width: 1200,
  height: 900,
  mime_type: "image/jpeg",
  size_bytes: 1024,
  original_filename: "image.jpg",
  source_url: null,
  created_at: "2025-01-01T00:00:00Z",
};

describe("ImageGridItem progressive loading", () => {
  it("renders skeleton placeholder while image loads", () => {
    render(<ImageGridItem image={baseImage} />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("fades preview blur out once full image loads", () => {
    const { container } = render(<ImageGridItem image={baseImage} />);

    const preview = container.querySelector('img[aria-hidden="true"]');
    const fullImage = container.querySelector('img[alt="Progressive Image"]');

    expect(preview).toBeInTheDocument();
    expect(fullImage).toBeInTheDocument();

    fireEvent.load(fullImage!);

    expect(preview).toHaveClass("opacity-0");
    expect(fullImage).toHaveClass("opacity-100");
  });

  it("skips preview placeholder for GIFs", () => {
    const gifImage = { ...baseImage, mime_type: "image/gif", id: "gif-1" };
    const { container } = render(<ImageGridItem image={gifImage} />);

    const preview = container.querySelector('img[aria-hidden="true"]');
    expect(preview).not.toBeInTheDocument();
  });
});
