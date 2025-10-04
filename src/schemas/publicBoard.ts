import { z } from 'zod';
import { boardWithImagesSchema } from './boardWithImages';

/**
 * Schema for owner profile returned by get_public_board RPC
 */
export const publicBoardOwnerSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

export type PublicBoardOwner = z.infer<typeof publicBoardOwnerSchema>;

/**
 * Schema for the full public board response (board + owner + images)
 */
export const publicBoardResponseSchema = z.object({
  board: boardWithImagesSchema,
  owner: publicBoardOwnerSchema,
});

export type PublicBoardResponse = z.infer<typeof publicBoardResponseSchema>;
