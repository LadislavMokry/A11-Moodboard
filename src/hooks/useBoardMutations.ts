import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  createBoard,
  updateBoard,
  deleteBoard,
  regenerateShareToken,
} from '@/services/boards';
import type { BoardCreate, BoardUpdate } from '@/schemas/board';

/**
 * Hook to create a new board
 * Invalidates boards query on success
 */
export function useCreateBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BoardCreate) => createBoard(data),
    onSuccess: () => {
      // Invalidate boards list to refetch
      queryClient.invalidateQueries({ queryKey: ['boards', user?.id] });
    },
  });
}

/**
 * Hook to update an existing board
 * Invalidates both boards list and individual board query on success
 */
export function useUpdateBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, updates }: { boardId: string; updates: BoardUpdate }) =>
      updateBoard(boardId, updates),
    onSuccess: (data) => {
      // Invalidate boards list
      queryClient.invalidateQueries({ queryKey: ['boards', user?.id] });
      // Invalidate and update the specific board
      queryClient.invalidateQueries({ queryKey: ['board', data.id] });
      // Optimistically update the cache
      queryClient.setQueryData(['board', data.id], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, ...data };
      });
    },
  });
}

/**
 * Hook to delete a board
 * Invalidates boards query on success
 */
export function useDeleteBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onSuccess: (_, boardId) => {
      // Invalidate boards list to refetch
      queryClient.invalidateQueries({ queryKey: ['boards', user?.id] });
      // Remove the deleted board from cache
      queryClient.removeQueries({ queryKey: ['board', boardId] });
    },
  });
}

/**
 * Hook to regenerate a board's share token
 * Invalidates the specific board query on success
 */
export function useRegenerateShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => regenerateShareToken(boardId),
    onSuccess: (data) => {
      // Invalidate and update the specific board
      queryClient.invalidateQueries({ queryKey: ['board', data.id] });
      // Optimistically update the cache with new share_token
      queryClient.setQueryData(['board', data.id], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, share_token: data.share_token };
      });
    },
  });
}
