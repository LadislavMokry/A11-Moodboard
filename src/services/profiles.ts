import { supabase } from '@/lib/supabase';
import { ProfileSchema, ProfileUpdateSchema, type Profile, type ProfileUpdate, type Theme } from '@/schemas/profile';

/**
 * Fetches a user profile by user ID
 */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  // Validate and parse response with Zod
  const parsed = ProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid profile data: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Upserts (inserts or updates) a user profile
 */
export async function upsertProfile(profile: ProfileUpdate): Promise<Profile> {
  // Validate input with Zod
  const parsed = ProfileUpdateSchema.safeParse(profile);
  if (!parsed.success) {
    throw new Error(`Invalid profile update data: ${parsed.error.message}`);
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(parsed.data, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }

  // Validate response
  const validated = ProfileSchema.safeParse(data);
  if (!validated.success) {
    throw new Error(`Invalid profile response: ${validated.error.message}`);
  }

  return validated.data;
}

/**
 * Updates only the theme field for a user
 */
export async function updateProfileTheme(userId: string, theme: Theme): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update theme: ${error.message}`);
  }

  // Validate response
  const validated = ProfileSchema.safeParse(data);
  if (!validated.success) {
    throw new Error(`Invalid profile response: ${validated.error.message}`);
  }

  return validated.data;
}
