import { supabase } from '@/lib/supabase';
import { boardWithImagesSchema, type BoardWithImages } from '@/schemas/boardWithImages';
import { BoardNotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Fetches a public board by its share token
 * Uses the get_public_board RPC which bypasses RLS for public viewing
 * Returns board with images and owner profile info
 */
export async function getPublicBoard(shareToken: string): Promise<BoardWithImages> {
  const { data, error } = await supabase
    .rpc('get_public_board', { p_share_token: shareToken });

  if (error) {
    throw new Error(`Failed to fetch public board: ${error.message}`);
  }

  if (!data) {
    throw new BoardNotFoundError('Public board not found with that share token');
  }

  // The RPC returns a JSONB object with structure: { board: {...}, owner: {...}, images: [...] }
  // We need to extract and restructure this data
  const boardData = {
    ...data.board,
    images: data.images || [],
  };

  // Validate response
  const parsed = boardWithImagesSchema.safeParse(boardData);
  if (!parsed.success) {
    throw new ValidationError(`Invalid public board data: ${parsed.error.message}`);
  }

  return parsed.data;
}
