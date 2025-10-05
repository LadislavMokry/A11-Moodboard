import { supabase } from '@/lib/supabase';
import { ValidationError } from '@/lib/errors';
import { imageSchema, type Image, type ImageCreate, type ImageUpdate } from '@/schemas/image';
import { getFileExtension, validateImageFile } from '@/lib/imageValidation';

const BUCKET = 'board-images';

export async function uploadImage(file: File, boardId: string): Promise<{
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string | null;
}> {
  validateImageFile(file);

  const extension = getFileExtension(file);
  const uuid = crypto.randomUUID();
  const filename = `${uuid}.${extension}`;
  const storagePath = `boards/${boardId}/${filename}`;
  const contentType = file.type || 'application/octet-stream';

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return {
    storagePath,
    mimeType: contentType,
    sizeBytes: file.size,
    originalFilename: file.name || null,
  };
}

export async function addImageToBoard(boardId: string, imageData: ImageCreate): Promise<Image> {
  const { data, error } = await supabase.rpc('add_image_at_top', {
    p_board_id: boardId,
    p_storage_path: imageData.storage_path,
    p_mime_type: imageData.mime_type || '',
    p_width: imageData.width || 0,
    p_height: imageData.height || 0,
    p_size_bytes: imageData.size_bytes || 0,
    p_original_filename: imageData.original_filename || '',
    p_source_url: imageData.source_url || '',
    p_caption: imageData.caption || '',
  });

  if (error) {
    throw new Error(`Failed to add image to board: ${error.message}`);
  }

  const parsed = imageSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid image data: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function updateImage(imageId: string, updates: ImageUpdate): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .update(updates)
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update image: ${error.message}`);
  }

  const parsed = imageSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid image data: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function deleteImage(imageId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete_images', {
    body: { imageIds: [imageId] },
  });

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

export async function deleteImages(imageIds: string[]): Promise<void> {
  const { error } = await supabase.functions.invoke('delete_images', {
    body: { imageIds },
  });

  if (error) {
    throw new Error(`Failed to delete images: ${error.message}`);
  }
}