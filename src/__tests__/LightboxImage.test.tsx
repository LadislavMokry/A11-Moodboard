
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LightboxImage } from "@/components/LightboxImage";
import { type Image } from "@/schemas/image";

const startMock = vi.fn();

const springAxis = {
  to: (callback: (value: number) => string) => callback(0),
  get: () => 0,
};

vi.mock("@react-spring/web", () => ({
  animated: {
    img: (props: any) => <img {...props} />,
  },
  useSpring: () => [{ x: springAxis, y: springAxis }, { start: startMock }],
}));

type GestureReturn = ReturnType<typeof vi.fn>;
const gestureMock = vi.fn(() => ({} as GestureReturn));

vi.mock("@use-gesture/react", () => ({
  useGesture: () => gestureMock,
}));

vi.mock("@/lib/imageUtils", () => ({
  getSupabasePublicUrl: vi.fn((path: string) => "https://cdn.example.com/" + path),
  getSupabaseThumbnail: vi.fn((path: string, size: number) => path + "?w=" + size),
}));

const image: Image = {
  id: "img-77",
  board_id: "board-abc",
  storage_path: "boards/board-abc/photo.jpg",
  caption: "Large Photo",
  position: 1,
  width: 4000,
  height: 2600,
  mime_type: "image/jpeg",
