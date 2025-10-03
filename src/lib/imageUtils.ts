/**
 * Utility functions for working with Supabase Storage images
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Generates a Supabase CDN URL with image transforms
 * @param storagePath - Full storage path (e.g., "boards/uuid/image.jpg")
 * @param width - Desired width in pixels
 * @param quality - Image quality (1-100, default 75)
 * @returns CDN URL with transforms
 */
export function getSupabaseThumbnail(
  storagePath: string,
  width: number,
  quality: number = 75,
): string {
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is not defined');
  }

  // Supabase storage transform API format:
  // /storage/v1/render/image/public/{bucket}/{path}?width={width}&quality={quality}
  const bucket = 'board-images';
  const encodedPath = encodeURIComponent(storagePath);

  return `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${encodedPath}?width=${width}&quality=${quality}`;
}

/**
 * Generates srcset string for responsive images (1x, 2x)
 * @param storagePath - Full storage path
 * @param baseWidth - Base width in pixels (default 360)
 * @returns srcset string
 */
export function getImageSrcSet(storagePath: string, baseWidth: number = 360): string {
  const src1x = getSupabaseThumbnail(storagePath, baseWidth);
  const src2x = getSupabaseThumbnail(storagePath, baseWidth * 2);

  return `${src1x} 1x, ${src2x} 2x`;
}

/**
 * Generates full public URL for a storage path
 * @param storagePath - Full storage path
 * @returns Public URL
 */
export function getSupabasePublicUrl(storagePath: string): string {
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is not defined');
  }

  const bucket = 'board-images';
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}
