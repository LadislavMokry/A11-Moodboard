import { getProfile, upsertProfile, updateProfileTheme } from '../services/profiles';
import { supabase } from '../lib/supabase';
import type { Profile } from '../schemas/profile';

// Mock the Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Profile Service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch and validate a profile successfully', async () => {
      const mockProfile: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        theme: 'dark',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getProfile('123e4567-e89b-12d3-a456-426614174000');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockProfile);
    });

    it('should throw error when profile not found', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(getProfile('nonexistent-id')).rejects.toThrow('Failed to fetch profile');
    });

    it('should throw error when profile data is invalid', async () => {
      const invalidProfile = {
        id: 'invalid-uuid',
        display_name: 'John',
        // missing required fields
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: invalidProfile, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(getProfile('some-id')).rejects.toThrow('Invalid profile data');
    });
  });

  describe('upsertProfile', () => {
    it('should upsert and validate a profile successfully', async () => {
      const profileUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'Jane Doe',
        theme: 'light' as const,
      };

      const mockProfile: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'Jane Doe',
        avatar_url: null,
        theme: 'light',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockUpsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });

      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert,
      });
      mockUpsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await upsertProfile(profileUpdate);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpsert).toHaveBeenCalledWith(profileUpdate, { onConflict: 'id' });
      expect(result).toEqual(mockProfile);
    });

    it('should throw error when upsert fails', async () => {
      const profileUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'Jane Doe',
      };

      const mockUpsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      });

      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert,
      });
      mockUpsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      await expect(upsertProfile(profileUpdate)).rejects.toThrow('Failed to upsert profile');
    });

    it('should throw error when input validation fails', async () => {
      const invalidUpdate = {
        // missing required id field
        display_name: 'Jane Doe',
      };

      await expect(upsertProfile(invalidUpdate as any)).rejects.toThrow('Invalid profile update data');
    });
  });

  describe('updateProfileTheme', () => {
    it('should update theme successfully', async () => {
      const mockProfile: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'John Doe',
        avatar_url: null,
        theme: 'dark',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateProfileTheme('123e4567-e89b-12d3-a456-426614174000', 'dark');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({ theme: 'dark' });
      expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockProfile);
    });

    it('should throw error when update fails', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      await expect(updateProfileTheme('some-id', 'light')).rejects.toThrow('Failed to update theme');
    });

    it('should handle all valid theme values', async () => {
      const themes = ['system', 'light', 'dark'] as const;

      for (const theme of themes) {
        const mockProfile: Profile = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          display_name: 'John Doe',
          avatar_url: null,
          theme,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };

        const mockUpdate = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSelect = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });

        (supabase.from as any).mockReturnValue({
          update: mockUpdate,
        });
        mockUpdate.mockReturnValue({
          eq: mockEq,
        });
        mockEq.mockReturnValue({
          select: mockSelect,
        });
        mockSelect.mockReturnValue({
          single: mockSingle,
        });

        const result = await updateProfileTheme('123e4567-e89b-12d3-a456-426614174000', theme);
        expect(result.theme).toBe(theme);
      }
    });
  });
});
