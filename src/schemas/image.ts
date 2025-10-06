import { z } from "zod";

/**
 * Image schema - matches the images table structure from bootstrap.sql
 */
export const imageSchema = z.object({
  id: z.string().uuid(),
  board_id: z.string().uuid(),
  storage_path: z.string().min(1),
  position: z.number().int().positive(),
  mime_type: z.string().nullable().optional(),
  width: z.number().int().min(0).nullable().optional(),
  height: z.number().int().min(0).nullable().optional(),
  size_bytes: z.number().int().min(0).nullable().optional(),
  original_filename: z.string().nullable().optional(),
  source_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  caption: z.string().max(140, "Caption must be 140 characters or less").nullable().optional(),
  created_at: z.string()
});

/**
 * Image creation schema - omits auto-generated fields
 */
export const imageCreateSchema = imageSchema.omit({
  id: true,
  created_at: true
});

/**
 * Image update schema - allows updating caption only
 */
export const imageUpdateSchema = imageSchema
  .pick({
    caption: true
  })
  .partial();

/**
 * TypeScript types derived from schemas
 */
export type Image = z.infer<typeof imageSchema>;
export type ImageCreate = z.infer<typeof imageCreateSchema>;
export type ImageUpdate = z.infer<typeof imageUpdateSchema>;
