import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderImage } from '@/services/imageReorder';
import { toast } from '@/lib/toast';
import type { Image } from '@/schemas/image';
import type { BoardWithImages } from '@/schemas/boardWithImages';

interface QueueReorderArgs {
  imageId: string;
  newIndex: number;
  updatedImages: Image[];
}

interface ReorderVariables {
  boardId: string;
  imageId: string;
  newPosition: number;
  updatedImages: Image[];
  previousBoard?: BoardWithImages;
}

interface MutationContext {
  previousBoard?: BoardWithImages;
}

export function useImageReorder(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<number | null>(null);
  const latestVariables = useRef<ReorderVariables | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const mutation = useMutation<void, Error, ReorderVariables, MutationContext>({
    mutationFn: ({ boardId: targetBoardId, imageId, newPosition }) =>
      reorderImage(targetBoardId, imageId, newPosition),
    onMutate: (variables) => ({ previousBoard: variables.previousBoard }),
    onError: (error, variables, context) => {
      const previous = context?.previousBoard;
      if (previous) {
        queryClient.setQueryData(['board', variables.boardId], previous);
      }
      toast.error(error.message ?? 'Failed to reorder image');
      setIsSaving(false);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
      setIsSaving(false);
    },
  });

  const scheduleMutation = useCallback(
    (variables: ReorderVariables) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      latestVariables.current = variables;
      debounceRef.current = window.setTimeout(() => {
        if (latestVariables.current) {
          mutation.mutate(latestVariables.current);
          latestVariables.current = null;
          debounceRef.current = null;
        }
      }, 250);
    },
    [mutation],
  );

  const queueReorder = useCallback(
    ({ imageId, newIndex, updatedImages }: QueueReorderArgs) => {
      if (!boardId) {
        return;
      }

      const queryKey = ['board', boardId] as const;
      const existingBoard = queryClient.getQueryData<BoardWithImages>(queryKey);

      const previousBoard = existingBoard
        ? {
            ...existingBoard,
            images: existingBoard.images.map((image) => ({ ...image })),
          }
        : undefined;

      if (existingBoard) {
        const nextBoard: BoardWithImages = {
          ...existingBoard,
          images: updatedImages,
        };
        queryClient.setQueryData(queryKey, nextBoard);
      }

      const variables: ReorderVariables = {
        boardId,
        imageId,
        newPosition: newIndex + 1,
        updatedImages,
        previousBoard,
      };

      setIsSaving(true);
      scheduleMutation(variables);
    },
    [boardId, queryClient, scheduleMutation],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    queueReorder,
    isSaving: isSaving || mutation.isPending,
  };
}
