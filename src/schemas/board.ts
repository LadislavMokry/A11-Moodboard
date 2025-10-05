import { z } from 'zod';

/**
 * Board schema - matches the boards table structure
 */
export const boardSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string().min(1, 'Board name is required').max(60, 'Board name must be 60 characters or less'),
  description: z.string().max(160, 'Description must be 160 characters or less').nullable().optional(),
  share_token: z.string().uuid(),
  cover_rotation_enabled: z.boolean().default(true),
  is_showcase: z.boolean().default(false),
  og_image_id: z.string().uuid().nullable().optional(), // Image to use for OG preview
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Board creation schema - omits auto-generated fields
 */
export const boardCreateSchema = boardSchema.omit({
  id: true,
  owner_id: true,
  share_token: true,
  created_at: true,
  updated_at: true,
});

/**
 * Board update schema - partial, allows updating specific fields only
 */
export const boardUpdateSchema = boardSchema.pick({
  name: true,
  description: true,
  cover_rotation_enabled: true,
  og_image_id: true,
}).partial();

/**
 * TypeScript types derived from schemas
 */
export type Board = z.infer<typeof boardSchema>;
export type BoardCreate = z.infer<typeof boardCreateSchema>;
export type BoardUpdate = z.infer<typeof boardUpdateSchema>;
