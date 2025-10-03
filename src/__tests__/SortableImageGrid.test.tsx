import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableImageGrid } from '@/components/SortableImageGrid';
import type { Image } from '@/schemas/image';

const dndHandlers = vi.hoisted(() => ({
  onDragStart: undefined as ((event: DragStartEvent) => void) | undefined,
  onDragEnd: undefined as ((event: DragEndEvent) => void) | undefined,
  onDragCancel: undefined as ((event: any) => void) | undefined,
}));

const queueReorderMock = vi.hoisted(() => vi.fn());

vi.mock('@dnd-kit/core', async () => {
  const React = await import('react');
  return {
    DndContext: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      dndHandlers.onDragStart = props.onDragStart as typeof dndHandlers.onDragStart;
      dndHandlers.onDragEnd = props.onDragEnd as typeof dndHandlers.onDragEnd;
      dndHandlers.onDragCancel = props.onDragCancel as typeof dndHandlers.onDragCancel;
      return <div data-testid="dnd-context">{children}</div>;
    },
    DragOverlay: ({ children }: React.PropsWithChildren) => <div data-testid="drag-overlay">{children}</div>,
    useSensors: (...args: unknown[]) => args,
    useSensor: (_sensor: unknown, config: unknown) => config,
    PointerSensor: function PointerSensor() {},
    TouchSensor: function TouchSensor() {},
    KeyboardSensor: function KeyboardSensor() {},
    closestCenter: vi.fn(),
  };
});

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: React.PropsWithChildren) => <>{children}</>,
  rectSortingStrategy: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
  arrayMove: <T,>(items: T[], from: number, to: number) => {
    const clone = [...items];
    const [moved] = clone.splice(from, 1);
    clone.splice(to, 0, moved);
    return clone;
  },
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@/hooks/useImageReorder', () => ({
  useImageReorder: () => ({
    queueReorder: queueReorderMock,
    isSaving: false,
  }),
}));

function createImages(): Image[] {
  return [
    {
      id: 'image-1',
      board_id: 'board-1',
      storage_path: 'path/image-1.jpg',
      position: 1,
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      size_bytes: 1024,
      original_filename: 'image-1.jpg',
      source_url: null,
      caption: 'Image 1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'image-2',
      board_id: 'board-1',
      storage_path: 'path/image-2.jpg',
      position: 2,
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      size_bytes: 1024,
      original_filename: 'image-2.jpg',
      source_url: null,
      caption: 'Image 2',
      created_at: new Date().toISOString(),
    },
  ];
}

function renderGrid(images: Image[]) {
  return render(<SortableImageGrid boardId="board-1" images={images} />);
}

describe('SortableImageGrid', () => {
  beforeEach(() => {
    queueReorderMock.mockReset();
    dndHandlers.onDragStart = undefined;
    dndHandlers.onDragEnd = undefined;
    dndHandlers.onDragCancel = undefined;
  });

  afterEach(() => {
    queueReorderMock.mockReset();
  });

  it('renders images sorted by ascending position', () => {
    const images = createImages().reverse();
    renderGrid(images);

    const cards = screen.getAllByTestId(/sortable-image-card-/);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Image 1');
    expect(cards[1]).toHaveTextContent('Image 2');
  });

  it('reorders items locally and queues server reorder on drag end', async () => {
    const images = createImages();
    renderGrid(images);

    const cardsBefore = screen.getAllByTestId(/sortable-image-card-/);
    expect(cardsBefore[0]).toHaveTextContent('Image 1');
    expect(cardsBefore[1]).toHaveTextContent('Image 2');

    await act(async () => {
      dndHandlers.onDragStart?.({ active: { id: 'image-2' } } as DragStartEvent);
      dndHandlers.onDragEnd?.({ active: { id: 'image-2' }, over: { id: 'image-1' } } as DragEndEvent);
    });

    const cardsAfter = screen.getAllByTestId(/sortable-image-card-/);
    expect(cardsAfter[0]).toHaveTextContent('Image 2');
    expect(cardsAfter[1]).toHaveTextContent('Image 1');

    expect(queueReorderMock).toHaveBeenCalledTimes(1);
    expect(queueReorderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'image-2',
        newIndex: 0,
      }),
    );
  });
});
