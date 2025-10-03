import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getBoards } from '@/services/boards';

/**
 * Hook to fetch all boards for the current authenticated user
 * Boards are ordered by updated_at DESC (most recently updated first)
 */
export function useBoards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['boards', user?.id],
    queryFn: getBoards,
    enabled: !!user?.id, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
}
