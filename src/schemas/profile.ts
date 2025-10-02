import { z } from 'zod';

// Theme enum schema
export const ThemeSchema = z.enum(['system', 'light', 'dark']);

// Profile schema matching the profiles table
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  theme: ThemeSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

// Profile update schema (all fields optional except id)
export const ProfileUpdateSchema = ProfileSchema.partial().required({ id: true });

// TypeScript types derived from schemas
export type Theme = z.infer<typeof ThemeSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
