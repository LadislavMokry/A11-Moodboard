import { supabase } from '@/lib/supabase';
import { publicBoardResponseSchema, type PublicBoardResponse } from '@/schemas/publicBoard';
import { BoardNotFoundError, ValidationError } from '@/lib/errors';

/**
 * Fetches a public board by its share token
 * Uses the get_public_board RPC which bypasses RLS for public viewing
 * Returns board with images and owner profile info
 */
export async function getPublicBoard(shareToken: string): Promise<PublicBoardResponse> {
  const { data, error } = await supabase
    .rpc('get_public_board', { p_share_token: shareToken });

  if (error) {
    throw new Error(`Failed to fetch public board: ${error.message}`);
  }

  if (!data) {
    throw new BoardNotFoundError('Public board not found with that share token');
  }

  // The RPC returns a JSONB object with structure: { board: {...}, owner: {...}, images: [...] }
  // We need to restructure to match our schema
  const responseData = {
    board: {
      ...data.board,
      images: data.images || [],
    },
    owner: data.owner,
  };

  // Validate response
  const parsed = publicBoardResponseSchema.safeParse(responseData);
  if (!parsed.success) {
    throw new ValidationError(`Invalid public board data: ${parsed.error.message}`);
  }

  return parsed.data;
}
