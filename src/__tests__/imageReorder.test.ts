import { describe, expect, it, vi, beforeEach } from 'vitest';
import { reorderImage } from '@/services/imageReorder';

const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: supabaseMock,
}));

const rpcMock = supabaseMock.rpc;

describe('imageReorder service', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('calls reorder_images RPC with expected parameters', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await reorderImage('board-1', 'image-1', 3);

    expect(rpcMock).toHaveBeenCalledWith('reorder_images', {
      p_board_id: 'board-1',
      p_image_id: 'image-1',
      p_new_index: 3,
    });
  });

  it('throws when RPC returns an error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(reorderImage('board-1', 'image-1', 2)).rejects.toThrow(
      'Failed to reorder image: boom',
    );
  });
});
