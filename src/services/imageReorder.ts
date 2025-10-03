import { supabase } from '@/lib/supabase';

export async function reorderImage(boardId: string, imageId: string, newPosition: number): Promise<void> {
  const { error } = await supabase.rpc('reorder_images', {
    p_board_id: boardId,
    p_image_id: imageId,
    p_new_index: newPosition,
  });

  if (error) {
    throw new Error(`Failed to reorder image: ${error.message}`);
  }
}
