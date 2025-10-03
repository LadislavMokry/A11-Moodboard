import { boardSchema, boardCreateSchema, boardUpdateSchema } from '../schemas/board';

describe('Board Schemas', () => {
  describe('boardSchema', () => {
    it('validates a complete valid board object', () => {
      const validBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        description: 'A collection of inspiring images',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(validBoard);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validBoard);
      }
    });

    it('accepts null description', () => {
      const boardWithNullDesc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        description: null,
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(boardWithNullDesc);
      expect(result.success).toBe(true);
    });

    it('accepts omitted optional description', () => {
      const boardWithoutDesc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(boardWithoutDesc);
      expect(result.success).toBe(true);
    });

    it('fails when name is empty', () => {
      const invalidBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: '',
        description: 'A collection',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Board name is required');
      }
    });

    it('fails when name exceeds 60 characters', () => {
      const invalidBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'A'.repeat(61),
        description: 'A collection',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Board name must be 60 characters or less');
      }
    });

    it('accepts name with exactly 60 characters', () => {
      const validBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'A'.repeat(60),
        description: 'A collection',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(validBoard);
      expect(result.success).toBe(true);
    });

    it('fails when description exceeds 160 characters', () => {
      const invalidBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        description: 'A'.repeat(161),
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be 160 characters or less');
      }
    });

    it('accepts description with exactly 160 characters', () => {
      const validBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        description: 'A'.repeat(160),
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(validBoard);
      expect(result.success).toBe(true);
    });

    it('fails when id is not a valid UUID', () => {
      const invalidBoard = {
        id: 'invalid-uuid',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        description: 'A collection',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
    });

    it('fails when owner_id is not a valid UUID', () => {
      const invalidBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: 'invalid-uuid',
        name: 'My Moodboard',
        description: 'A collection',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
    });

    it('fails when share_token is not a valid UUID', () => {
      const invalidBoard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Moodboard',
        description: 'A collection',
        share_token: 'invalid-uuid',
        cover_rotation_enabled: true,
        is_showcase: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = boardSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
    });
  });

  describe('boardCreateSchema', () => {
    it('validates valid board creation data', () => {
      const validCreate = {
        name: 'My New Board',
        description: 'A fresh moodboard',
        cover_rotation_enabled: true,
        is_showcase: false,
      };

      const result = boardCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCreate);
      }
    });

    it('validates minimal board creation data', () => {
      const minimalCreate = {
        name: 'My Board',
      };

      const result = boardCreateSchema.safeParse(minimalCreate);
      expect(result.success).toBe(true);
    });

    it('fails when name is missing', () => {
      const invalidCreate = {
        description: 'A board without a name',
      };

      const result = boardCreateSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it('fails when name is empty', () => {
      const invalidCreate = {
        name: '',
        description: 'A board',
      };

      const result = boardCreateSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it('fails when name exceeds 60 characters', () => {
      const invalidCreate = {
        name: 'A'.repeat(61),
      };

      const result = boardCreateSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it('fails when description exceeds 160 characters', () => {
      const invalidCreate = {
        name: 'My Board',
        description: 'A'.repeat(161),
      };

      const result = boardCreateSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it('rejects auto-generated fields (id, owner_id, share_token)', () => {
      const createWithAutoFields = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        owner_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'My Board',
        share_token: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = boardCreateSchema.safeParse(createWithAutoFields);
      // Should succeed but auto-generated fields should be stripped
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('id');
        expect(result.data).not.toHaveProperty('owner_id');
        expect(result.data).not.toHaveProperty('share_token');
      }
    });
  });

  describe('boardUpdateSchema', () => {
    it('validates partial update with all fields', () => {
      const validUpdate = {
        name: 'Updated Name',
        description: 'Updated description',
        cover_rotation_enabled: false,
      };

      const result = boardUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });

    it('validates update with only name', () => {
      const partialUpdate = {
        name: 'Updated Name',
      };

      const result = boardUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('validates update with only description', () => {
      const partialUpdate = {
        description: 'Updated description',
      };

      const result = boardUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('validates update with only cover_rotation_enabled', () => {
      const partialUpdate = {
        cover_rotation_enabled: false,
      };

      const result = boardUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('validates empty update object', () => {
      const emptyUpdate = {};

      const result = boardUpdateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('fails when name is empty', () => {
      const invalidUpdate = {
        name: '',
      };

      const result = boardUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('fails when name exceeds 60 characters', () => {
      const invalidUpdate = {
        name: 'A'.repeat(61),
      };

      const result = boardUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('fails when description exceeds 160 characters', () => {
      const invalidUpdate = {
        description: 'A'.repeat(161),
      };

      const result = boardUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('accepts null description to clear it', () => {
      const updateWithNull = {
        description: null,
      };

      const result = boardUpdateSchema.safeParse(updateWithNull);
      expect(result.success).toBe(true);
    });
  });
});
