import { imageSchema, imageCreateSchema, imageUpdateSchema } from '../schemas/image';

describe('Image Schemas', () => {
  describe('imageSchema', () => {
    it('validates a complete valid image object', () => {
      const validImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        caption: 'A beautiful sunset',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validImage);
      }
    });

    it('accepts null caption', () => {
      const imageWithNullCaption = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        caption: null,
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(imageWithNullCaption);
      expect(result.success).toBe(true);
    });

    it('accepts omitted optional caption', () => {
      const imageWithoutCaption = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(imageWithoutCaption);
      expect(result.success).toBe(true);
    });

    it('validates GIF images', () => {
      const gifImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/animation.gif',
        url: 'https://example.com/animation.gif',
        width: 500,
        height: 500,
        position: 1,
        is_gif: true,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(gifImage);
      expect(result.success).toBe(true);
    });

    it('fails when caption exceeds 140 characters', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        caption: 'A'.repeat(141),
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Caption must be 140 characters or less');
      }
    });

    it('accepts caption with exactly 140 characters', () => {
      const validImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        caption: 'A'.repeat(140),
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
    });

    it('fails when id is not a valid UUID', () => {
      const invalidImage = {
        id: 'invalid-uuid',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when board_id is not a valid UUID', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: 'invalid-uuid',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when url is not a valid URL', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'not-a-valid-url',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when width is not positive', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 0,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when width is negative', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: -100,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when height is not positive', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 0,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when position is not positive', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
        position: 0,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it('fails when width is not an integer', () => {
      const invalidImage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920.5,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });
  });

  describe('imageCreateSchema', () => {
    it('validates valid image creation data', () => {
      const validCreate = {
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        caption: 'A sunset',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
      };

      const result = imageCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCreate);
      }
    });

    it('validates minimal image creation data', () => {
      const minimalCreate = {
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
        position: 1,
      };

      const result = imageCreateSchema.safeParse(minimalCreate);
      expect(result.success).toBe(true);
    });

    it('fails when required fields are missing', () => {
      const invalidCreate = {
        caption: 'A sunset',
      };

      const result = imageCreateSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it('fails when caption exceeds 140 characters', () => {
      const invalidCreate = {
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        caption: 'A'.repeat(141),
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
      };

      const result = imageCreateSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it('rejects auto-generated fields (id, created_at)', () => {
      const createWithAutoFields = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        board_id: '123e4567-e89b-12d3-a456-426614174001',
        storage_path: 'boards/123e4567-e89b-12d3-a456-426614174001/image.jpg',
        url: 'https://example.com/image.jpg',
        width: 1920,
        height: 1080,
        position: 1,
        is_gif: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = imageCreateSchema.safeParse(createWithAutoFields);
      // Should succeed but auto-generated fields should be stripped
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('id');
        expect(result.data).not.toHaveProperty('created_at');
      }
    });
  });

  describe('imageUpdateSchema', () => {
    it('validates update with caption', () => {
      const validUpdate = {
        caption: 'Updated caption',
      };

      const result = imageUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });

    it('validates empty update object', () => {
      const emptyUpdate = {};

      const result = imageUpdateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('accepts null caption to clear it', () => {
      const updateWithNull = {
        caption: null,
      };

      const result = imageUpdateSchema.safeParse(updateWithNull);
      expect(result.success).toBe(true);
    });

    it('fails when caption exceeds 140 characters', () => {
      const invalidUpdate = {
        caption: 'A'.repeat(141),
      };

      const result = imageUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('accepts caption with exactly 140 characters', () => {
      const validUpdate = {
        caption: 'A'.repeat(140),
      };

      const result = imageUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });
});
