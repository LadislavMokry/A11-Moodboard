import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { imageSchema, type Image } from '@/schemas/image';
import { boardSchema } from '@/schemas/board'; // Import boardSchema
import { ZodError } from 'zod'; // Import ZodError

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

      const boardIds = boardsData?.map(board => {
        try {
          return boardSchema.parse(board).id;
        } catch (e) {
          if (e instanceof ZodError) {
            console.error("ZodError parsing board:", e.issues, "Data:", board);
          }
          throw e;
        }
      }) || [];

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

      const parsedImages = imagesData?.map((item) => {
        try {
          return imageSchema.parse(item);
        } catch (e) {
          if (e instanceof ZodError) {
            console.error("ZodError parsing image:", e.issues, "Data:", item);
          }
          throw e;
        }
      }) || [];
      return parsedImages;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
