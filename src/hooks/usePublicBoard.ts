import { useQuery } from '@tanstack/react-query';
import { getPublicBoard } from '@/services/publicBoards';

/**
 * Hook to fetch a public board by its share token
 * Does not require authentication
 * Used for public board viewing
 */
export function usePublicBoard(shareToken: string | undefined) {
  return useQuery({
    queryKey: ['publicBoard', shareToken],
    queryFn: () => {
      if (!shareToken) {
        throw new Error('Share token is required');
      }
      return getPublicBoard(shareToken);
    },
    enabled: !!shareToken, // Only run query if shareToken is provided
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes (public boards change less frequently)
  });
}
