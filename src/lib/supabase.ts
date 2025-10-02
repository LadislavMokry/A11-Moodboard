import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Type-safe environment variable validation
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}. Please check your .env file.`
    );
  }
  return value;
};

// Environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Create singleton Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export type for use in other files
export type { Database } from '../types/database';
