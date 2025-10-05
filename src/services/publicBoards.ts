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
  const dataObj = data as { board: any; owner: any; images: any[] };

  // Ensure images array exists and is properly assigned
  const images = Array.isArray(dataObj.images) ? dataObj.images : [];

  const responseData = {
    board: {
      ...dataObj.board,
      share_token: shareToken, // Add share_token from URL parameter (RPC doesn't return it)
      images: images,
    },
    owner: dataObj.owner,
  };

  // Validate response
  const parsed = publicBoardResponseSchema.safeParse(responseData);
  if (!parsed.success) {
    throw new ValidationError(`Invalid public board data: ${parsed.error.message}`);
  }

  return parsed.data;
}
