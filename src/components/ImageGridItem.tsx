import { useState, useRef, useEffect, type CSSProperties } from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import { MoreVertical, Check } from 'lucide-react';
import { type Image } from '@/schemas/image';
import { getSupabaseThumbnail, getSupabasePublicUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';

type SyntheticListenerMap = Record<string, Function> | undefined;

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
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

const LOW_RES_WIDTH = 40;

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
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
}: ImageGridItemProps) {
  const isGif = image.mime_type?.toLowerCase() === 'image/gif';
  const [isHovered, setIsHovered] = useState(false);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(isGif);
  const [isFullLoaded, setIsFullLoaded] = useState(false);
  const captionRef = useRef<HTMLDivElement>(null);

  // Reset progressive loading state when the image changes
  useEffect(() => {
    setIsFullLoaded(false);
    setIsPreviewLoaded(isGif);
  }, [image.id, isGif]);

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
  const previewSrc = isGif ? undefined : getSupabaseThumbnail(image.storage_path, LOW_RES_WIDTH);
  const srcFull = getSupabasePublicUrl(image.storage_path);

  const srcSet = `${src360} 360w, ${src720} 720w, ${src1080} 1080w`;
  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelection?.();
    } else {
      onClick?.();
    }
  };

  const combinedStyle: CSSProperties = {
    ...(style ?? {}),
    contain: 'layout paint',
  };

  const imageContainerStyle: CSSProperties = {
    aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
    contain: 'layout paint',
  };

  return (
    <div
      ref={(node) => setRef?.(node)}
      data-testid={dataTestId}
      {...(dragAttributes ?? {})}
      {...(dragListeners ?? {})}
      style={combinedStyle}
      className={cn(
        'group relative mb-4 break-inside-avoid cursor-pointer touch-manipulation transition-opacity duration-200',
        isDragging && 'opacity-50',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-800"
        style={imageContainerStyle}
      >
        <Skeleton
          className={cn('absolute inset-0 h-full w-full transition-opacity duration-500', (isPreviewLoaded || isFullLoaded) && 'opacity-0')}
        />

        {!isGif && previewSrc && (
          <img
            src={previewSrc}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 h-full w-full scale-105 transform-gpu object-cover blur-lg transition-opacity duration-500',
              isFullLoaded ? 'opacity-0' : isPreviewLoaded ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={() => setIsPreviewLoaded(true)}
            loading="lazy"
            decoding="async"
          />
        )}

        <img
          src={isGif ? srcFull : src720}
          srcSet={isGif ? undefined : srcSet}
          sizes={isGif ? undefined : sizes}
          alt={image.caption || ''}
          loading="lazy"
          decoding="async"
          className={cn(
            'relative z-10 h-auto w-full object-cover transition-opacity duration-500',
            isFullLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => {
            setIsFullLoaded(true);
            if (!isGif) {
              setIsPreviewLoaded(true);
            }
          }}
          onError={() => {
            setIsFullLoaded(true);
            setIsPreviewLoaded(true);
          }}
          draggable={false}
        />

        {/* Selection overlay when selected */}
        {isSelected && (
          <div
            className="pointer-events-none absolute inset-0 border-2 border-violet-500 bg-violet-500/20"
            aria-hidden="true"
          />
        )}

        {/* 2px white outline on hover (only when not in selection mode) */}
        {!selectionMode && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 transition-opacity duration-150',
              isHovered ? 'opacity-100' : 'opacity-0',
            )}
            style={{ boxShadow: 'inset 0 0 0 2px white' }}
          />
        )}

        {/* Checkbox (top-left) - shown in selection mode or on hover */}
        {(selectionMode || isHovered) && (
          <button
            className={cn(
              'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border-2 transition-all duration-150',
              'bg-black/60 backdrop-blur-sm hover:bg-black/80',
              isSelected ? 'border-violet-500 bg-violet-500' : 'border-white',
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelection?.();
            }}
            aria-label={isSelected ? 'Deselect image' : 'Select image'}
            type="button"
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>
        )}

        {/* Bottom-third caption overlay (visible on hover if caption exists) */}
        {image.caption && (
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2 transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div
              ref={captionRef}
              className={cn(
                'whitespace-nowrap overflow-hidden text-sm text-white',
                shouldMarquee && isHovered ? 'animate-marquee' : '',
              )}
            >
              {image.caption}
            </div>
          </div>
        )}

        {/* Three-dot menu button (top-right, visible on hover, hidden in selection mode) */}
        {!selectionMode && (
          <button
            className={cn(
              'absolute right-2 top-2 rounded-sm bg-black/60 p-1.5 backdrop-blur-sm transition-opacity duration-150 hover:bg-black/80',
              isHovered ? 'opacity-100' : 'opacity-0',
            )}
            onClick={(event) => {
              event.stopPropagation();
              onMenuClick?.(event);
            }}
            aria-label="Image options"
          >
            <MoreVertical className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
