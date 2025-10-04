import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateImage, deleteImage } from '@/services/images';
import type { ImageUpdate } from '@/schemas/image';

/**
 * Hook to update an image (currently only caption)
 * Invalidates board query on success with optimistic update
 */
export function useUpdateImage(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, updates }: { imageId: string; updates: ImageUpdate }) =>
      updateImage(imageId, updates),
    onMutate: async ({ imageId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });

      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData(['board', boardId]);

      // Optimistically update the image in the board data
      queryClient.setQueryData(['board', boardId], (old: any) => {
        if (!old || !old.images) return old;

        return {
          ...old,
          images: old.images.map((img: any) =>
            img.id === imageId ? { ...img, ...updates } : img,
          ),
        };
      });

      // Return context with snapshot for rollback
      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', boardId], context.previousBoard);
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

/**
 * Hook to delete an image
 * Optimistically removes from cache and reverts on error
 */
export function useDeleteImage(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteImage(imageId),
    onMutate: async (imageId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });

      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData(['board', boardId]);

      // Optimistically remove the image from the board data
      queryClient.setQueryData(['board', boardId], (old: any) => {
        if (!old || !old.images) return old;

        return {
          ...old,
          images: old.images.filter((img: any) => img.id !== imageId),
        };
      });

      // Return context with snapshot for rollback
      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', boardId], context.previousBoard);
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}
