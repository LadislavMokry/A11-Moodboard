import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { uploadImage, addImageToBoard, deleteImage } from '@/services/images';
import { ValidationError } from '@/lib/errors';
import type { Image } from '@/schemas/image';

const mocks = vi.hoisted(() => {
  const uploadMock = vi.fn();
  const rpcMock = vi.fn();
  const invokeMock = vi.fn();
  const storageFromMock = vi.fn(() => ({ upload: uploadMock }));

  return {
    uploadMock,
    rpcMock,
    invokeMock,
    storageFromMock,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: mocks.storageFromMock,
    },
    rpc: mocks.rpcMock,
    functions: {
      invoke: mocks.invokeMock,
    },
  },
}));

const uploadMock = mocks.uploadMock;
const rpcMock = mocks.rpcMock;
const invokeMock = mocks.invokeMock;

let randomUUIDSpy: ReturnType<typeof vi.spyOn<typeof crypto, 'randomUUID'>> | null = null;

const boardId = '123e4567-e89b-12d3-a456-426614174001';

const createMockImage = (): Image => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  board_id: boardId,
  storage_path: `boards/${boardId}/uuid.jpg`,
  position: 1,
  mime_type: 'image/jpeg',
  width: 800,
  height: 600,
  size_bytes: 12345,
  original_filename: 'photo.jpg',
  source_url: null,
  caption: null,
  created_at: new Date().toISOString(),
});

describe('image services', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    rpcMock.mockReset();
    invokeMock.mockReset();
    mocks.storageFromMock.mockClear();
    randomUUIDSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid');
  });

  afterEach(() => {
    randomUUIDSpy?.mockRestore();
  });

  it('uploads image to storage and returns metadata', async () => {
    uploadMock.mockResolvedValue({ data: { path: `boards/${boardId}/test-uuid.jpg` }, error: null });

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await uploadImage(file, boardId);

    expect(mocks.storageFromMock).toHaveBeenCalledWith('board-images');
    expect(uploadMock).toHaveBeenCalledWith(`boards/${boardId}/test-uuid.jpg`, file, {
      cacheControl: '3600',
      contentType: 'image/jpeg',
      upsert: false,
    });
    expect(result).toEqual({
      storagePath: `boards/${boardId}/test-uuid.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: file.size,
      originalFilename: 'photo.jpg',
    });
  });

  it('throws validation error for unsupported file type', async () => {
    const file = new File(['data'], 'document.txt', { type: 'text/plain' });

    await expect(uploadImage(file, boardId)).rejects.toThrow(ValidationError);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('throws validation error when file exceeds size limit', async () => {
    const buffer = new Uint8Array(11 * 1024 * 1024);
    const file = new File([buffer], 'big.jpg', { type: 'image/jpeg' });

    await expect(uploadImage(file, boardId)).rejects.toThrow('File is too large');
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('adds uploaded image to board via RPC', async () => {
    const mockImage = createMockImage();

    rpcMock.mockResolvedValue({ data: mockImage, error: null });

    const result = await addImageToBoard(boardId, {
      board_id: boardId,
      storage_path: mockImage.storage_path,
      position: 1,
      mime_type: mockImage.mime_type,
      width: mockImage.width,
      height: mockImage.height,
      size_bytes: mockImage.size_bytes,
      original_filename: mockImage.original_filename,
      source_url: null,
      caption: null,
    });

    expect(rpcMock).toHaveBeenCalledWith('add_image_at_top', {
      p_board_id: boardId,
      p_storage_path: mockImage.storage_path,
      p_mime_type: mockImage.mime_type,
      p_width: mockImage.width,
      p_height: mockImage.height,
      p_size_bytes: mockImage.size_bytes,
      p_original_filename: mockImage.original_filename,
      p_source_url: null,
      p_caption: null,
    });
    expect(result).toEqual(mockImage);
  });

  it('invokes delete_images edge function when deleting', async () => {
    invokeMock.mockResolvedValue({ data: null, error: null });

    await deleteImage('123e4567-e89b-12d3-a456-426614174099');

    expect(invokeMock).toHaveBeenCalledWith('delete_images', {
      body: { image_ids: ['123e4567-e89b-12d3-a456-426614174099'] },
    });
  });
});