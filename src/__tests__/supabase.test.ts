import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Supabase client', () => {
  it('should create client with valid environment variables', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should have auth functionality', () => {
    // Verify the client has auth functionality
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.getSession).toBe('function');
    expect(typeof supabase.auth.signOut).toBe('function');
    expect(typeof supabase.auth.signInWithOAuth).toBe('function');
  });

  it('should validate that client is properly configured', () => {
    // Test that we can access the client methods
    expect(supabase.from).toBeDefined();
    expect(supabase.storage).toBeDefined();
    expect(supabase.rpc).toBeDefined();
  });
});
