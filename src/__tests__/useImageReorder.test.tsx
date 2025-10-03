import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useImageReorder } from '@/hooks/useImageReorder';
import type { BoardWithImages } from '@/schemas/boardWithImages';
import { reorderImage } from '@/services/imageReorder';

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock('@/lib/toast', () => ({
  toast: toastMock,
}));

vi.mock('@/services/imageReorder', () => ({
  reorderImage: vi.fn(),
}));

const reorderImageMock = vi.mocked(reorderImage);

const boardId = 'board-1';

const baseBoard: BoardWithImages = {
  id: boardId,
  owner_id: 'owner-1',
  name: 'Test Board',
  description: null,
  share_token: 'token',
  cover_rotation_enabled: false,
  is_showcase: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [
    {
      id: 'image-1',
      board_id: boardId,
      storage_path: 'path/image-1.jpg',
      position: 1,
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      size_bytes: 1000,
      original_filename: 'image-1.jpg',
      source_url: null,
      caption: 'Image 1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'image-2',
      board_id: boardId,
      storage_path: 'path/image-2.jpg',
      position: 2,
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      size_bytes: 1200,
      original_filename: 'image-2.jpg',
      source_url: null,
      caption: 'Image 2',
      created_at: new Date().toISOString(),
    },
  ],
};

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useImageReorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reorderImageMock.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    toastMock.error.mockReset();
  });

  it('queues reorder with debounce and updates cache optimistically', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(['board', boardId], baseBoard);

    const { result } = renderHook(() => useImageReorder(boardId), {
      wrapper: createWrapper(queryClient),
    });

    const updatedImages = [
      { ...baseBoard.images[1], position: 1 },
      { ...baseBoard.images[0], position: 2 },
    ];

    act(() => {
      result.current.queueReorder({ imageId: 'image-2', newIndex: 0, updatedImages });
    });

    const optimisticBoard = queryClient.getQueryData<BoardWithImages>(['board', boardId]);
    expect(optimisticBoard?.images[0].id).toBe('image-2');
    expect(result.current.isSaving).toBe(true);
    expect(reorderImageMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(reorderImageMock).toHaveBeenCalledWith(boardId, 'image-2', 1);
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('reverts cache when mutation fails', async () => {
    reorderImageMock.mockRejectedValueOnce(new Error('Network error'));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(['board', boardId], baseBoard);

    const { result } = renderHook(() => useImageReorder(boardId), {
      wrapper: createWrapper(queryClient),
    });

    const updatedImages = [
      { ...baseBoard.images[1], position: 1 },
      { ...baseBoard.images[0], position: 2 },
    ];

    act(() => {
      result.current.queueReorder({ imageId: 'image-2', newIndex: 0, updatedImages });
    });

    await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    const revertedBoard = queryClient.getQueryData<BoardWithImages>(['board', boardId]);
    expect(revertedBoard?.images[0].id).toBe('image-1');
    expect(result.current.isSaving).toBe(false);
    expect(toastMock.error).toHaveBeenCalledWith('Network error');
  });
});
