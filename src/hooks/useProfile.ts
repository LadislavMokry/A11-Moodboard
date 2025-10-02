import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/profiles';

/**
 * Hook to fetch the current user's profile
 * Automatically refetches when user changes
 */
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }
      return getProfile(user.id);
    },
    enabled: !!user?.id, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}
