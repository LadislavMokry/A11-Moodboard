import { ValidationError } from '@/lib/errors';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit from storage policies

type AllowedMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const MIME_EXTENSION_MAP: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function isAllowedMimeType(mimeType: string | undefined | null): mimeType is AllowedMimeType {
  return mimeType ? ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedMimeType) : false;
}

export function getFileExtension(file: File): string {
  const fileNameExtension = file.name.split('.').pop();
  if (fileNameExtension && fileNameExtension !== file.name) {
    return fileNameExtension.toLowerCase();
  }

  if (isAllowedMimeType(file.type)) {
    return MIME_EXTENSION_MAP[file.type];
  }

  throw new ValidationError('Unsupported file type');
}

export function validateImageFile(file: File): void {
  if (!isAllowedMimeType(file.type)) {
    throw new ValidationError('Unsupported file type. Allowed types: JPG, PNG, WebP, GIF');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ValidationError('File is too large. Maximum size is 10MB');
  }
}

export function getAcceptString(): string {
  return ALLOWED_IMAGE_MIME_TYPES.join(',');
}