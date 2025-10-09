import { createRef } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LightboxImage } from '@/components/LightboxImage';
import { type Image } from '@/schemas/image';

const startMock = vi.fn();

const springAxis = {
  to: (callback: (value: number) => string) => callback(0),
  get: () => 0,
};

vi.mock('@react-spring/web', () => ({
  animated: {
    img: (props: Record<string, unknown>) => <img {...props} />,
  },
  useSpring: () => [{ x: springAxis, y: springAxis }, { start: startMock }],
}));

let gestureHandlers: Record<string, (state: unknown) => void> | undefined;
const bindMock = vi.fn(() => ({}));

vi.mock('@use-gesture/react', () => ({
  useGesture: (handlers: Record<string, (state: unknown) => void>) => {
    gestureHandlers = handlers;
    return bindMock;
  },
}));

vi.mock('@/lib/imageUtils', () => ({
  getSupabasePublicUrl: vi.fn((path: string) => `https://cdn.example.com/${path}`),
  getSupabaseThumbnail: vi.fn((path: string, size: number) => `${path}?w=${size}`),
}));

const image: Image = {
  id: '123e4567-e89b-12d3-a456-426614174999',
  board_id: '123e4567-e89b-12d3-a456-426614174000',
  storage_path: 'boards/board-abc/photo.jpg',
  caption: 'Large Photo',
  position: 1,
  width: 4000,
  height: 2600,
  mime_type: 'image/jpeg',
  size_bytes: 1_024_000,
  original_filename: 'photo.jpg',
  source_url: null,
  created_at: '2025-01-01T00:00:00Z',
};

describe('LightboxImage', () => {
  beforeEach(() => {
    startMock.mockClear();
    bindMock.mockClear();
    gestureHandlers = undefined;
  });

  it('forwards the container ref to callers', () => {
    const containerRef = createRef<HTMLDivElement>();

    render(
      <LightboxImage
        ref={containerRef}
        image={image}
        scale={1}
        onScaleChange={vi.fn()}
        onPanChange={vi.fn()}
      />,
    );

    expect(containerRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('invokes onPanChange when dragging while zoomed', () => {
    const containerRef = createRef<HTMLDivElement>();
    const onPanChange = vi.fn();

    render(
      <LightboxImage
        ref={containerRef}
        image={image}
        scale={2}
        onScaleChange={vi.fn()}
        onPanChange={onPanChange}
      />,
    );

    expect(gestureHandlers).toBeDefined();

    const container = containerRef.current!;
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () =>
        ({
          width: 800,
          height: 600,
          top: 0,
          left: 0,
          right: 800,
          bottom: 600,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
      configurable: true,
    });

    const mainImage = screen.getByAltText('Large Photo') as HTMLImageElement;
    Object.defineProperty(mainImage, 'naturalWidth', { value: 4000, configurable: true });
    Object.defineProperty(mainImage, 'naturalHeight', { value: 2600, configurable: true });
    fireEvent.load(mainImage);

    gestureHandlers?.onDrag?.({
      first: true,
      movement: [120, 90],
      event: { preventDefault: vi.fn(), stopPropagation: vi.fn() },
    });

    expect(onPanChange).toHaveBeenCalledWith(120, 90);
    expect(startMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 120, y: 90, immediate: true }),
    );
  });
});
