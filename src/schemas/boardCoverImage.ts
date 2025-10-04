import { z } from 'zod';

/**
 * Board cover image schema - matches the board_cover_images table
 */
export const boardCoverImageSchema = z.object({
  board_id: z.string().uuid(),
  image_id: z.string().uuid(),
  position: z.number().int().positive(),
  created_at: z.string(),
});

/**
 * Board cover image create schema - omits created_at
 */
export const boardCoverImageCreateSchema = boardCoverImageSchema.omit({
  created_at: true,
});

/**
 * TypeScript types derived from schemas
 */
export type BoardCoverImage = z.infer<typeof boardCoverImageSchema>;
export type BoardCoverImageCreate = z.infer<typeof boardCoverImageCreateSchema>;
