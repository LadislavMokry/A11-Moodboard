import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transferImages, type TransferImagesParams } from '@/services/transferImages';

interface UseTransferImagesOptions {
  onSuccess?: (destBoardId: string) => void;
}

export function useTransferImages(options?: UseTransferImagesOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transferImages,
    onMutate: ({ imageIds }: TransferImagesParams) => {
      // Show progress toast for large batches
      if (imageIds.length > 5) {
        toast.loading(`Transferring ${imageIds.length} images...`, {
          id: 'transfer-progress',
        });
      }
    },
    onSuccess: (data, variables) => {
      const { operation, sourceBoardId, destBoardId, imageIds } = variables;

      // Dismiss progress toast
      toast.dismiss('transfer-progress');

      // Invalidate queries for both source and destination boards
      queryClient.invalidateQueries({ queryKey: ['board', sourceBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', destBoardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });

      // Get destination board name from cache
      const destBoard = queryClient.getQueryData<{ name: string }>(['board', destBoardId]);
      const destBoardName = destBoard?.name || 'board';

      // Show success toast
      const actionText = operation === 'copy' ? 'copied to' : 'moved to';
      const imageText = imageIds.length === 1 ? 'image' : 'images';
      toast.success(`${imageIds.length} ${imageText} ${actionText} ${destBoardName}`);

      // Call optional success callback
      options?.onSuccess?.(destBoardId);
    },
    onError: (error: Error) => {
      // Dismiss progress toast
      toast.dismiss('transfer-progress');

      // Show error toast
      toast.error(error.message || 'Failed to transfer images');
    },
  });
}
