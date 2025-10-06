import { Skeleton } from "@/components/Skeleton";
import { getSupabasePublicUrl, getSupabaseThumbnail } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { type Image } from "@/schemas/image";
import type { DraggableAttributes } from "@dnd-kit/core";
import { Check, MoreVertical } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";

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
  forceHover?: boolean;
}

const LOW_RES_WIDTH = 40;

export const ImageGridItem = memo(function ImageGridItem({ image, onClick, onMenuClick, setRef, dragAttributes, dragListeners, style, className, isDragging = false, dataTestId, selectionMode = false, isSelected = false, onToggleSelection, forceHover }: ImageGridItemProps) {
  const isGif = image.mime_type?.toLowerCase() === "image/gif";
  const [isHovered, setIsHovered] = useState(false);
  const effectiveIsHovered = forceHover !== undefined ? forceHover : isHovered;
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(isGif);
  const [isFullLoaded, setIsFullLoaded] = useState(false);
  const captionRef = useRef<HTMLDivElement>(null);

  // Touch handling for mobile
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [preventClick, setPreventClick] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      setTouchStartTime(Date.now());
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setIsLongPress(false);
      setPreventClick(false);

      // Set up long press timer (500ms)
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPress(true);
        // Trigger save functionality for mobile long press
        if (!selectionMode && navigator.share) {
          // Try to share the image URL or download it
          const imageUrl = getSupabasePublicUrl(image.storage_path);
          navigator
            .share({
              title: image.caption || "Image",
              url: imageUrl
            })
            .catch(() => {
              // Fallback: trigger download
              const link = document.createElement("a");
              link.href = imageUrl;
              link.download = `image-${image.id}`;
              link.click();
            });
        }
        setPreventClick(true);
      }, 500);
    },
    [image, selectionMode]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!touchStartPos || isLongPress) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);

      // If moved more than 10px, it's a swipe/scroll gesture
      if (deltaX > 10 || deltaY > 10) {
        // Clear long press timer and prevent click
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setPreventClick(true);
      }
    },
    [touchStartPos, isLongPress]
  );

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    // Prevent click if it was a swipe or long press
    if (preventClick) return;

    if (selectionMode) {
      onToggleSelection?.();
    } else {
      onClick?.();
    }
  }, [preventClick, selectionMode, onToggleSelection, onClick]);

  const combinedStyle: CSSProperties = {
    ...(style ?? {}),
    contain: "layout paint"
  };

  const imageContainerStyle: CSSProperties = {
    contain: "layout paint",
    width: "100%",
    maxWidth: "280px" // Match column width from masonry layout
  };

  return (
    <div
      ref={(node) => setRef?.(node)}
      data-testid={dataTestId}
      {...(dragAttributes ?? {})}
      {...(dragListeners ?? {})}
      style={combinedStyle}
      className={cn("group relative break-inside-avoid cursor-pointer touch-manipulation transition-opacity duration-200", isDragging && "opacity-50", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
        style={imageContainerStyle}
      >
        <Skeleton className={cn("absolute inset-0 h-full w-full transition-opacity duration-500", (isPreviewLoaded || isFullLoaded) && "opacity-0")} />

        {!isGif && previewSrc && (
          <img
            src={previewSrc}
            alt=""
            aria-hidden="true"
            className={cn("absolute inset-0 h-full w-full scale-105 transform-gpu object-scale-down blur-lg transition-opacity duration-500 will-change-opacity", isFullLoaded ? "opacity-0" : isPreviewLoaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setIsPreviewLoaded(true)}
            loading="lazy"
            decoding="async"
          />
        )}

        <img
          src={isGif ? srcFull : src720}
          srcSet={isGif ? undefined : srcSet}
          sizes={isGif ? undefined : sizes}
          alt={image.caption || ""}
          loading="lazy"
          decoding="async"
          className={cn("relative z-10 h-full w-full object-scale-down transition-opacity duration-500 will-change-opacity", isFullLoaded ? "opacity-100" : "opacity-0")}
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
            className="pointer-events-none absolute inset-0 border-2 border-pink-500 bg-pink-500/20"
            aria-hidden="true"
          />
        )}

        {/* 2px white outline on hover (only when not in selection mode) */}
        {!selectionMode && (
          <div
            className={cn("pointer-events-none absolute inset-0 transition-opacity duration-150", effectiveIsHovered ? "opacity-100" : "opacity-0")}
            style={{ boxShadow: "inset 0 0 0 2px white" }}
          />
        )}

        {/* Checkbox (top-left) - shown in selection mode or on hover */}
        {(selectionMode || effectiveIsHovered) && (
          <button
            className={cn("absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border-2 transition-all duration-150", "bg-black/60 backdrop-blur-sm hover:bg-black/80", isSelected ? "border-pink-500 bg-pink-500" : "border-white")}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelection?.();
            }}
            aria-label={isSelected ? "Deselect image" : "Select image"}
            type="button"
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>
        )}

        {/* Bottom-third caption overlay (visible on hover if caption exists) */}
        {image.caption && (
          <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2 transition-opacity duration-200", effectiveIsHovered ? "opacity-100" : "opacity-0")}>
            <div
              ref={captionRef}
              className={cn("whitespace-nowrap overflow-hidden text-sm text-white", shouldMarquee && effectiveIsHovered ? "animate-marquee" : "")}
            >
              {image.caption}
            </div>
          </div>
        )}

        {/* Three-dot menu button (top-right, visible on hover, hidden in selection mode) */}
        {!selectionMode && (
          <button
            className={cn("absolute right-2 top-2 rounded-sm bg-black/60 p-1.5 backdrop-blur-sm transition-opacity duration-150 hover:bg-black/80", effectiveIsHovered ? "opacity-100" : "opacity-0")}
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
});
