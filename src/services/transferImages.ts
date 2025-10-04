import { supabase } from '@/lib/supabase';

const MAX_BATCH_SIZE = 20;

export interface TransferImagesParams {
  operation: 'copy' | 'move';
  sourceBoardId: string;
  destBoardId: string;
  imageIds: string[];
}

export interface TransferImagesResponse {
  success: boolean;
  transferredCount: number;
  errors?: string[];
}

/**
 * Transfer (copy or move) images between boards via Edge Function
 * @throws {Error} if batch size exceeds 20 or Edge Function fails
 */
export async function transferImages({
  operation,
  sourceBoardId,
  destBoardId,
  imageIds,
}: TransferImagesParams): Promise<TransferImagesResponse> {
  // Validate batch size
  if (imageIds.length === 0) {
    throw new Error('No images selected for transfer');
  }

  if (imageIds.length > MAX_BATCH_SIZE) {
    throw new Error(`Cannot transfer more than ${MAX_BATCH_SIZE} images at once`);
  }

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('transfer_images', {
    body: {
      operation,
      sourceBoardId,
      destBoardId,
      imageIds,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to transfer images');
  }

  return data as TransferImagesResponse;
}
