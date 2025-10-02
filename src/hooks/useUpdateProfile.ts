import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { upsertProfile, updateProfileTheme } from '@/services/profiles';
import type { ProfileUpdate, Theme } from '@/schemas/profile';

/**
 * Hook to update the current user's profile
 * Invalidates profile query on success
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Omit<ProfileUpdate, 'id'>) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }
      return upsertProfile({ ...updates, id: user.id });
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      // Optimistically update the cache
      queryClient.setQueryData(['profile', user?.id], data);
    },
  });
}

/**
 * Hook to update only the theme preference
 */
export function useUpdateTheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (theme: Theme) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }
      return updateProfileTheme(user.id, theme);
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      // Optimistically update the cache
      queryClient.setQueryData(['profile', user?.id], data);
    },
  });
}
