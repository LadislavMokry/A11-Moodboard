import { supabase } from '@/lib/supabase';
import { boardCoverImageSchema, type BoardCoverImage, type BoardCoverImageCreate } from '@/schemas/boardCoverImage';
import { z } from 'zod';

/**
 * Get cover images for a board
 */
export async function getBoardCoverImages(boardId: string): Promise<BoardCoverImage[]> {
  const { data, error } = await supabase
    .from('board_cover_images')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch board cover images: ${error.message}`);
  }

  // Parse and validate with Zod
  const parsed = z.array(boardCoverImageSchema).parse(data);
  return parsed;
}

/**
 * Set cover images for a board (replaces all existing)
 * @param boardId - Board UUID
 * @param imageIds - Array of image IDs (max 12)
 */
export async function setBoardCoverImages(
  boardId: string,
  imageIds: string[]
): Promise<void> {
  if (imageIds.length > 12) {
    throw new Error('Maximum 12 cover images allowed');
  }

  // Delete existing cover images for this board
  const { error: deleteError } = await supabase
    .from('board_cover_images')
    .delete()
    .eq('board_id', boardId);

  if (deleteError) {
    throw new Error(`Failed to delete existing cover images: ${deleteError.message}`);
  }

  // Insert new cover images if any
  if (imageIds.length === 0) {
    return;
  }

  const coverImages: BoardCoverImageCreate[] = imageIds.map((imageId, index) => ({
    board_id: boardId,
    image_id: imageId,
    position: index + 1,
  }));

  const { error: insertError } = await supabase
    .from('board_cover_images')
    .insert(coverImages);

  if (insertError) {
    throw new Error(`Failed to insert cover images: ${insertError.message}`);
  }
}

/**
 * Clear all cover images for a board
 */
export async function clearBoardCoverImages(boardId: string): Promise<void> {
  const { error } = await supabase
    .from('board_cover_images')
    .delete()
    .eq('board_id', boardId);

  if (error) {
    throw new Error(`Failed to clear cover images: ${error.message}`);
  }
}
