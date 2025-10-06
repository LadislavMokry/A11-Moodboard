import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { imageSchema, type Image } from '@/schemas/image';

interface UseUserImagesProps {
  userId: string;
  enabled?: boolean;
}

export function useUserImages({ userId, enabled = true }: UseUserImagesProps) {
  return useQuery<Image[], Error>({
    queryKey: ['userImages', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const parsedImages = data.map((item) => imageSchema.parse(item));
      return parsedImages;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
