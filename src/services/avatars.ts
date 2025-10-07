import { supabase } from '@/lib/supabase';
import { ValidationError } from '@/lib/errors';

export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const AVATAR_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const AVATARS_BUCKET = 'avatars';

type AllowedAvatarMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

const MIME_EXTENSION_MAP: Record<AllowedAvatarMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getAvatarFileExtension(file: File, mimeType: AllowedAvatarMimeType): string {
  const fallbackExtension = MIME_EXTENSION_MAP[mimeType];
  const explicitExtension = file.name?.split('.').pop()?.toLowerCase();

  if (!explicitExtension) {
    return fallbackExtension;
  }

  if (explicitExtension === 'jpeg') {
    return 'jpg';
  }

  if (Object.values(MIME_EXTENSION_MAP).includes(explicitExtension)) {
    return explicitExtension;
  }

  return fallbackExtension;
}

function validateAvatarFile(file: File): AllowedAvatarMimeType {
  const mimeType = file.type;

  if (!AVATAR_ALLOWED_MIME_TYPES.includes(mimeType as AllowedAvatarMimeType)) {
    throw new ValidationError('Unsupported file type. Allowed types: JPG, PNG, WebP');
  }

  if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
    throw new ValidationError('File is too large. Maximum size is 2MB');
  }

  return mimeType as AllowedAvatarMimeType;
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const mimeType = validateAvatarFile(file);
  const extension = getAvatarFileExtension(file, mimeType);
  const filename = `${crypto.randomUUID()}.${extension}`;
  const storagePath = `avatars/${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage.from(AVATARS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    contentType: mimeType,
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(storagePath);

  if (!data?.publicUrl) {
    throw new Error('Failed to generate avatar URL');
  }

  return data.publicUrl;
}
