import { useState, useRef, useEffect, type CSSProperties } from 'react';
import type { DraggableAttributes, SyntheticListenerMap } from '@dnd-kit/core';
import { MoreVertical } from 'lucide-react';
import { type Image } from '@/schemas/image';
import { getSupabaseThumbnail, getSupabasePublicUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

interface ImageGridItemProps {
  image: Image;
  onClick?: () => void;
  onMenuClick?: (e: React.MouseEvent) => void;
  setRef?: (node: HTMLDivElement | null) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  style?: CSSProperties;
  className?: string;
  isDragging?: boolean;
  dataTestId?: string;
}

export function ImageGridItem({
  image,
  onClick,
  onMenuClick,
  setRef,
  dragAttributes,
  dragListeners,
  style,
  className,
  isDragging = false,
  dataTestId,
}: ImageGridItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const captionRef = useRef<HTMLDivElement>(null);

  // Check if caption text overflows and needs marquee
  useEffect(() => {
    if (captionRef.current && image.caption) {
      const element = captionRef.current;
      setShouldMarquee(element.scrollWidth > element.clientWidth);
    }
  }, [image.caption]);

  // Generate responsive image URLs
  const src360 = getSupabaseThumbnail(image.storage_path, 360);
  const src720 = getSupabaseThumbnail(image.storage_path, 720);
  const src1080 = getSupabaseThumbnail(image.storage_path, 1080);
  const srcFull = getSupabasePublicUrl(image.storage_path);

  const srcSet = `${src360} 360w, ${src720} 720w, ${src1080} 1080w`;
  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  const isGif = image.mime_type?.toLowerCase() === 'image/gif';

  return (
    <div
      ref={(node) => setRef?.(node)}
      data-testid={dataTestId}
      {...(dragAttributes ?? {})}
      {...(dragListeners ?? {})}
      style={style}
      className={cn(
        'group relative mb-4 break-inside-avoid cursor-pointer',
        isDragging && 'ring-2 ring-violet-500/60',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-800">
        <img
          src={isGif ? srcFull : src720}
          srcSet={isGif ? undefined : srcSet}
          sizes={isGif ? undefined : sizes}
          alt={image.caption || ''}
          loading="lazy"
          className="w-full h-auto object-cover transition-opacity duration-200"
          style={{
            aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
          }}
        />

        {/* 2px white outline on hover */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            boxShadow: 'inset 0 0 0 2px white',
          }}
        />

        {/* Bottom-third caption overlay (visible on hover if caption exists) */}
        {image.caption && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              ref={captionRef}
              className={`text-sm text-white overflow-hidden whitespace-nowrap ${
                shouldMarquee && isHovered ? 'animate-marquee' : ''
              }`}
            >
              {image.caption}
            </div>
          </div>
        )}

        {/* Three-dot menu button (top-right, visible on hover) */}
        <button
          className={`absolute top-2 right-2 p-1.5 rounded-sm bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick?.(e);
          }}
          aria-label="Image options"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
