import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { uploadAvatar } from '@/services/avatars';

export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const publicUrl = await uploadAvatar(file, user.id);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });

      return publicUrl;
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
      toast.success('Avatar updated');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update avatar';
      toast.error(message);
    },
  });
}
