import { z } from 'zod';
import { boardSchema } from './board';
import { imageSchema } from './image';

/**
 * Board with images - extends Board schema with images array
 */
export const boardWithImagesSchema = boardSchema.extend({
  images: z.array(imageSchema),
});

/**
 * TypeScript type derived from schema
 */
export type BoardWithImages = z.infer<typeof boardWithImagesSchema>;
