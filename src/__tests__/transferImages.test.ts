import { describe, expect, it, beforeEach, vi } from 'vitest';
import { transferImages } from '@/services/transferImages';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('transferImages service', () => {
  const mockSourceBoardId = '123e4567-e89b-12d3-a456-426614174000';
  const mockDestBoardId = '123e4567-e89b-12d3-a456-426614174001';
  const mockImageIds = ['img-1', 'img-2', 'img-3'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully transfers images with copy operation', async () => {
    const mockResponse = {
      success: true,
      transferredCount: 3,
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await transferImages({
      operation: 'copy',
      sourceBoardId: mockSourceBoardId,
      destBoardId: mockDestBoardId,
      imageIds: mockImageIds,
    });

    expect(result).toEqual(mockResponse);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('transfer_images', {
      body: {
        operation: 'copy',
        sourceBoardId: mockSourceBoardId,
        destBoardId: mockDestBoardId,
        imageIds: mockImageIds,
      },
    });
  });

  it('successfully transfers images with move operation', async () => {
    const mockResponse = {
      success: true,
      transferredCount: 2,
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await transferImages({
      operation: 'move',
      sourceBoardId: mockSourceBoardId,
      destBoardId: mockDestBoardId,
      imageIds: ['img-1', 'img-2'],
    });

    expect(result).toEqual(mockResponse);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('transfer_images', {
      body: {
        operation: 'move',
        sourceBoardId: mockSourceBoardId,
        destBoardId: mockDestBoardId,
        imageIds: ['img-1', 'img-2'],
      },
    });
  });

  it('throws error when image array is empty', async () => {
    await expect(
      transferImages({
        operation: 'copy',
        sourceBoardId: mockSourceBoardId,
        destBoardId: mockDestBoardId,
        imageIds: [],
      })
    ).rejects.toThrow('No images selected for transfer');

    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('throws error when batch size exceeds 20 images', async () => {
    const tooManyImages = Array.from({ length: 21 }, (_, i) => `img-${i}`);

    await expect(
      transferImages({
        operation: 'copy',
        sourceBoardId: mockSourceBoardId,
        destBoardId: mockDestBoardId,
        imageIds: tooManyImages,
      })
    ).rejects.toThrow('Cannot transfer more than 20 images at once');

    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('accepts batch of exactly 20 images', async () => {
    const maxImages = Array.from({ length: 20 }, (_, i) => `img-${i}`);
    const mockResponse = {
      success: true,
      transferredCount: 20,
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await transferImages({
      operation: 'copy',
      sourceBoardId: mockSourceBoardId,
      destBoardId: mockDestBoardId,
      imageIds: maxImages,
    });

    expect(result).toEqual(mockResponse);
    expect(supabase.functions.invoke).toHaveBeenCalled();
  });

  it('throws error when Edge Function returns error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Transfer failed'),
    });

    await expect(
      transferImages({
        operation: 'copy',
        sourceBoardId: mockSourceBoardId,
        destBoardId: mockDestBoardId,
        imageIds: mockImageIds,
      })
    ).rejects.toThrow('Transfer failed');
  });

  it('throws generic error when Edge Function returns error without message', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: {} as any,
    });

    await expect(
      transferImages({
        operation: 'copy',
        sourceBoardId: mockSourceBoardId,
        destBoardId: mockDestBoardId,
        imageIds: mockImageIds,
      })
    ).rejects.toThrow('Failed to transfer images');
  });
});
