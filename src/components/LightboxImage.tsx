import { useState } from 'react';
import { type Image } from '@/schemas/image';
import { getSupabasePublicUrl } from '@/lib/imageUtils';

interface LightboxImageProps {
  image: Image;
}

export function LightboxImage({ image }: LightboxImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const src = getSupabasePublicUrl(image.storage_path);

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-neutral-600 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={image.caption || ''}
        className="max-w-full max-h-full object-contain"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 200ms ease-in-out',
        }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
