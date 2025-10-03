import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { boardSchema, type Board, type BoardCreate, type BoardUpdate } from '@/schemas/board';
import { boardWithImagesSchema, type BoardWithImages } from '@/schemas/boardWithImages';
import { BoardNotFoundError, BoardOwnershipError, ValidationError } from '@/lib/errors';

/**
 * Fetches all boards for the current authenticated user
 * Ordered by updated_at DESC (most recently updated first)
 */
export async function getBoards(): Promise<Board[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BoardOwnershipError('Must be authenticated to fetch boards');
  }

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch boards: ${error.message}`);
  }

  // Validate array of boards
  const parsed = z.array(boardSchema).safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid boards data: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Fetches a single board with its images by board ID
 * Returns BoardWithImages (board + images array)
 */
export async function getBoard(boardId: string): Promise<BoardWithImages> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BoardOwnershipError('Must be authenticated to fetch board');
  }

  // Fetch board with images
  const { data, error } = await supabase
    .from('boards')
    .select(`
      *,
      images:images(*)
    `)
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new BoardNotFoundError(`Board not found: ${boardId}`);
    }
    throw new Error(`Failed to fetch board: ${error.message}`);
  }

  // Sort images by position
  if (data.images) {
    data.images.sort((a: any, b: any) => a.position - b.position);
  }

  // Validate response
  const parsed = boardWithImagesSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid board data: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Creates a new board for the current authenticated user
 */
export async function createBoard(boardData: BoardCreate): Promise<Board> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BoardOwnershipError('Must be authenticated to create board');
  }

  const { data, error } = await supabase
    .from('boards')
    .insert({
      ...boardData,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (duplicate board name for user)
    if (error.code === '23505') {
      throw new ValidationError(`A board named "${boardData.name}" already exists`);
    }
    throw new Error(`Failed to create board: ${error.message}`);
  }

  // Validate response
  const parsed = boardSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid board response: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Updates a board's fields (name, description, cover_rotation_enabled)
 */
export async function updateBoard(boardId: string, updates: BoardUpdate): Promise<Board> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BoardOwnershipError('Must be authenticated to update board');
  }

  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new BoardNotFoundError(`Board not found: ${boardId}`);
    }
    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new ValidationError(`A board with that name already exists`);
    }
    throw new Error(`Failed to update board: ${error.message}`);
  }

  // Validate response
  const parsed = boardSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid board response: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Deletes a board and all associated images
 * Calls the delete_board Edge Function for transactional deletion
 */
export async function deleteBoard(boardId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BoardOwnershipError('Must be authenticated to delete board');
  }

  // Verify ownership before calling edge function
  const { data: board, error: fetchError } = await supabase
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !board) {
    if (fetchError?.code === 'PGRST116') {
      throw new BoardNotFoundError(`Board not found: ${boardId}`);
    }
    throw new BoardOwnershipError('You do not have permission to delete this board');
  }

  // Call edge function
  const { error } = await supabase.functions.invoke('delete_board', {
    body: { board_id: boardId },
  });

  if (error) {
    throw new Error(`Failed to delete board: ${error.message}`);
  }
}

/**
 * Regenerates the share token for a board
 * This invalidates any existing public share links
 */
export async function regenerateShareToken(boardId: string): Promise<Board> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BoardOwnershipError('Must be authenticated to regenerate share token');
  }

  // Generate new UUID for share_token
  const { data, error } = await supabase
    .from('boards')
    .update({ share_token: crypto.randomUUID() })
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new BoardNotFoundError(`Board not found: ${boardId}`);
    }
    throw new Error(`Failed to regenerate share token: ${error.message}`);
  }

  // Validate response
  const parsed = boardSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid board response: ${parsed.error.message}`);
  }

  return parsed.data;
}
