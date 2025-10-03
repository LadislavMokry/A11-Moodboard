import { useQuery } from '@tanstack/react-query';
import { getBoard } from '@/services/boards';

/**
 * Hook to fetch a single board with its images by board ID
 * Returns BoardWithImages (board + images array)
 */
export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => {
      if (!boardId) {
        throw new Error('Board ID is required');
      }
      return getBoard(boardId);
    },
    enabled: !!boardId, // Only run query if boardId is provided
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
}
