import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { imageSchema } from '@/schemas/image';
import { toast } from 'sonner';

interface ImportFromUrlParams {
  boardId: string;
  imageUrl: string;
  caption?: string | null;
}

export function useImportFromUrl(boardId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId: bid, imageUrl, caption }: ImportFromUrlParams) => {
      const targetBoardId = bid || boardId;
      if (!targetBoardId) {
        throw new Error('Board ID is required');
      }

      const { data, error } = await supabase.functions.invoke('import_from_url', {
        body: {
          boardId: targetBoardId,
          url: imageUrl,
          caption: caption || null,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to import image from URL');
      }

      // Check if response indicates an error
      if (data?.error) {
        console.error('Edge Function returned error:', data);
        throw new Error(data.error || 'Failed to import image');
      }

      // Validate response
      const parsed = imageSchema.safeParse(data);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error);
        console.error('Received data:', data);
        throw new Error('Invalid image data received');
      }

      return parsed.data;
    },
    onSuccess: (_data, variables) => {
      const targetBoardId = variables.boardId || boardId;
      // Invalidate board query to refetch images
      queryClient.invalidateQueries({ queryKey: ['board', targetBoardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Image imported successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to import image:', error);
      toast.error(error.message || 'Failed to import image from URL');
    },
  });
}
