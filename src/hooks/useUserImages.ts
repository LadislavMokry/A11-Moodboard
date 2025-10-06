import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { imageSchema, type Image } from '@/schemas/image';
import { boardSchema } from '@/schemas/board'; // Import boardSchema

interface UseUserImagesProps {
  userId: string;
  enabled?: boolean;
}

export function useUserImages({ userId, enabled = true }: UseUserImagesProps) {
  return useQuery<Image[], Error>({
    queryKey: ['userImages', userId],
    queryFn: async () => {
      // 1. Fetch all boards owned by the user
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('id')
        .eq('owner_id', userId);

      if (boardsError) {
        throw new Error(boardsError.message);
      }

      const boardIds = boardsData?.map(board => boardSchema.parse(board).id) || [];

      if (boardIds.length === 0) {
        return []; // No boards, so no images
      }

      // 2. Fetch all images associated with these board IDs
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .in('board_id', boardIds)
        .order('created_at', { ascending: false });

      if (imagesError) {
        throw new Error(imagesError.message);
      }

      const parsedImages = imagesData?.map((item) => imageSchema.parse(item)) || [];
      return parsedImages;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
