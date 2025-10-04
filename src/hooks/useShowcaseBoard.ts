import { useQuery } from '@tanstack/react-query';
import { getShowcaseBoard } from '@/services/showcaseBoard';

/**
 * Hook to fetch the showcase board for the homepage
 * No authentication required - this is a public board
 */
export function useShowcaseBoard() {
  return useQuery({
    queryKey: ['showcaseBoard'],
    queryFn: getShowcaseBoard,
    staleTime: 5 * 60 * 1000, // 5 minutes - showcase board changes infrequently
    retry: 1, // Retry once on failure
  });
}
