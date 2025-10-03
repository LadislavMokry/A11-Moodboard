import { type Image } from '@/schemas/image';
import { getSupabaseThumbnail, getSupabasePublicUrl } from '@/lib/imageUtils';

interface CustomDragOverlayProps {
  image: Image;
}

export function CustomDragOverlay({ image }: CustomDragOverlayProps) {
  const src720 = getSupabaseThumbnail(image.storage_path, 720);
  const src1080 = getSupabaseThumbnail(image.storage_path, 1080);
  const srcFull = getSupabasePublicUrl(image.storage_path);

  const isGif = image.mime_type?.toLowerCase() === 'image/gif';
  const srcSet = isGif ? undefined : `${src720} 720w, ${src1080} 1080w`;

  return (
    <div
      className="pointer-events-none relative overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-800"
      style={{
        transform: 'scale(1.05) rotate(2deg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        transition: 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        maxWidth: '400px',
      }}
    >
      <img
        src={isGif ? srcFull : src720}
        srcSet={srcSet}
        sizes="400px"
        alt={image.caption || ''}
        className="w-full h-auto object-cover"
        style={{
          aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
        }}
      />

      {/* White outline for visibility */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 0 2px white',
        }}
      />

      {/* Caption if exists */}
      {image.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2">
          <div className="text-sm text-white overflow-hidden whitespace-nowrap text-ellipsis">
            {image.caption}
          </div>
        </div>
      )}
    </div>
  );
}