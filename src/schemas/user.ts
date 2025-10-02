// ABOUTME: Zod schema definitions and TypeScript types for User resources
// ABOUTME: Keeps runtime validation in sync with compile-time types.

import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

export type User = z.infer<typeof UserSchema>;

export const UserListSchema = z.array(UserSchema);
