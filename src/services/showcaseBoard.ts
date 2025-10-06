import { supabase } from "@/lib/supabase";
import { boardWithImagesSchema, type BoardWithImages } from "@/schemas/boardWithImages";

/**
 * Fetches the showcase board for display on the homepage (signed-out view)
 * Uses the get_showcase_board RPC which returns the board marked as is_showcase = true
 */
export async function getShowcaseBoard(): Promise<BoardWithImages> {
  const { data, error } = await supabase.rpc("get_showcase_board");

  if (error) {
    throw new Error(`Failed to fetch showcase board: ${error.message}`);
  }

  if (!data) {
    throw new Error("No showcase board found");
  }

  // The RPC returns: { board: {...}, owner: {...}, images: [...] }
  // We need to restructure to: { ...board, images: [...] }
  const dataObj = data as { board: any; owner: any; images: any[] };

  // Ensure images array exists and is properly assigned
  const images = Array.isArray(dataObj.images) ? dataObj.images : [];

  const boardData = {
    ...dataObj.board,
    images: images
  };

  // Parse and validate with Zod schema
  const parsed = boardWithImagesSchema.safeParse(boardData);

  if (!parsed.success) {
    throw new Error(`Invalid showcase board data: ${parsed.error.message}`);
  }

  return parsed.data;
}
