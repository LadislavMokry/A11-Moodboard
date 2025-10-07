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
  fitStyle?: "cover" | "contain";
  showOverlays?: boolean;
  useOriginalSrc?: boolean;
}

export const ImageGridItem = memo(function ImageGridItem({
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
  forceHover,
  fitStyle = "cover",
  showOverlays = true,
  useOriginalSrc = false,
}: ImageGridItemProps) {
  console.log(`ImageGridItem (${image.id}): Rendering`, { isSelected, isDragging, selectionMode, showOverlays });
  const isGif = image.mime_type?.toLowerCase() === "image/gif";
  const [isHovered, setIsHovered] = useState(false);
  const effectiveIsHovered = forceHover !== undefined ? forceHover : isHovered;
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [isFullLoaded, setIsFullLoaded] = useState(false);
  const captionRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  console.log(`ImageGridItem (${image.id}): State`, { isFullLoaded, isGif });

  // Touch handling for mobile
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [preventClick, setPreventClick] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset loading state when image ID changes
  useEffect(() => {
    setIsFullLoaded(isGif);
  }, [image.id, isGif]);

  // Effect to handle image loading, including cached images
  useEffect(() => {
    console.log(`ImageGridItem (${image.id}): Running loading effect`, { isGif, isFullLoaded });
    if (isGif) {
      console.log(`ImageGridItem (${image.id}): Is a GIF, marking as loaded`);
      setIsFullLoaded(true);
      return;
    }

    const img = imgRef.current;
    if (img?.complete) {
      console.log(`ImageGridItem (${image.id}): Image is from cache, marking as loaded`);
      setIsFullLoaded(true);
    }

    const timer = setTimeout(() => {
      if (!isFullLoaded) {
        console.log(`ImageGridItem (${image.id}): Fallback timer fired, marking as loaded`);
        setIsFullLoaded(true);
      }
    }, 2000);

    return () => {
      console.log(`ImageGridItem (${image.id}): Cleaning up loading effect`);
      clearTimeout(timer);
    };
  }, [isGif, isFullLoaded, image.id]);

  useEffect(() => {
    if (!showOverlays) {
      setShouldMarquee(false);
      return;
    }

    if (captionRef.current && image.caption) {
      const element = captionRef.current;
      setShouldMarquee(element.scrollWidth > element.clientWidth);
    }
  }, [image.caption, showOverlays]);

  const src360 = getSupabaseThumbnail(image.storage_path, 360);
  const src720 = getSupabaseThumbnail(image.storage_path, 720);
  const src1080 = getSupabaseThumbnail(image.storage_path, 1080);
  const srcFull = getSupabasePublicUrl(image.storage_path);

  const srcSet = `${src360} 360w, ${src720} 720w, ${src1080} 1080w`;
  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
  const shouldUseOriginal = useOriginalSrc || isGif || fitStyle === "contain";

  const [currentSrc, setCurrentSrc] = useState<string>(shouldUseOriginal ? srcFull : src720);
  const [currentSrcSet, setCurrentSrcSet] = useState<string | undefined>(shouldUseOriginal ? undefined : srcSet);
  const [retryStep, setRetryStep] = useState(0);

  useEffect(() => {
    setCurrentSrc(shouldUseOriginal ? srcFull : src720);
    setCurrentSrcSet(shouldUseOriginal ? undefined : srcSet);
    setRetryStep(0);
  }, [shouldUseOriginal, srcFull, src720, srcSet, image.id]);

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!showOverlays) {
        setTouchStartPos(null);
        setIsLongPress(false);
        setPreventClick(false);
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        return;
      }

      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setIsLongPress(false);
      setPreventClick(false);

      longPressTimerRef.current = setTimeout(() => {
        setIsLongPress(true);
        if (!selectionMode && navigator.share) {
          const imageUrl = getSupabasePublicUrl(image.storage_path);
          navigator
            .share({
              title: image.caption || "Image",
              url: imageUrl,
            })
            .catch(() => {
              const link = document.createElement("a");
              link.href = imageUrl;
              link.download = `image-${image.id}`;
              link.click();
            });
        }
        setPreventClick(true);
      }, 500);
    },
    [showOverlays, selectionMode, image.storage_path, image.caption, image.id],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!touchStartPos || !showOverlays) {
        return;
      }

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);

      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setPreventClick(true);
      }
    },
    [touchStartPos, showOverlays],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (preventClick) return;

    if (selectionMode && showOverlays) {
      onToggleSelection?.();
    } else {
      onClick?.();
    }
  }, [preventClick, selectionMode, showOverlays, onToggleSelection, onClick]);

  const containerClassName = cn(
    "group relative w-full max-w-full break-inside-avoid touch-manipulation transition-opacity duration-200",
    !showOverlays ? "cursor-default" : "cursor-pointer",
    fitStyle === "contain" && "flex items-center justify-center overflow-hidden",
    isDragging && "opacity-50",
    className,
  );

const aspectRatioValue = image.width && image.height ? `${image.width} / ${image.height}` : undefined;

  const containerStyle: CSSProperties = {
    ...(style ?? {}),
    contain: "layout paint",
    ...(fitStyle === "contain"
      ? {
          width: "100%",
          aspectRatio: aspectRatioValue
        }
      : {})
  };

  return (
    <div
      ref={(node) => setRef?.(node)}
      data-testid={dataTestId}
      {...(dragAttributes ?? {})}
      {...(dragListeners ?? {})}
      style={containerStyle}
      className={containerClassName}
      onMouseEnter={() => showOverlays && setIsHovered(true)}
      onMouseLeave={() => showOverlays && setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        srcSet={currentSrcSet}
        sizes={currentSrcSet ? sizes : undefined}
        alt={image.caption || ""}
        loading="lazy"
        decoding="async"
        className={imageClassName}
        style={fitStyle === "contain" ? undefined : aspectRatioValue ? { aspectRatio: aspectRatioValue } : undefined}
        onLoad={() => {
          console.log(`ImageGridItem (${image.id}): Full image loaded`);
          setIsFullLoaded(true);
        }}
        onError={() => {
          console.error(`ImageGridItem (${image.id}): Failed to load ${currentSrc}`);
          setIsFullLoaded(true);

          setRetryStep((prev) => {
            const nextStep = prev + 1;

            if (prev === 0) {
              if (shouldUseOriginal) {
                setCurrentSrc(src720);
                setCurrentSrcSet(srcSet);
              } else {
                setCurrentSrc(src360);
                setCurrentSrcSet(undefined);
              }
            } else if (prev === 1) {
              const cacheBusted = `${srcFull}${srcFull.includes("?") ? "&" : "?"}retry=${Date.now()}`;
              setCurrentSrc(cacheBusted);
              setCurrentSrcSet(undefined);
            }

            return nextStep;
          });
        }}
        draggable={false}
      />

      {showOverlays && isSelected && (
        <div className="pointer-events-none absolute inset-0 border-2 border-pink-500 bg-pink-500/20" aria-hidden="true" />
      )}

      {showOverlays && !selectionMode && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-150",
            effectiveIsHovered ? "opacity-100" : "opacity-0",
          )}
          style={{ boxShadow: "inset 0 0 0 2px white" }}
        />
      )}

      {showOverlays && (selectionMode || effectiveIsHovered) && (
        <button
          className={cn(
            "absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border-2 transition-all duration-150",
            "bg-black/60 backdrop-blur-sm hover:bg-black/80",
            isSelected ? "border-pink-500 bg-pink-500" : "border-white",
          )}
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

      {showOverlays && image.caption && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2 transition-opacity duration-200",
            effectiveIsHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            ref={captionRef}
            className={cn(
              "whitespace-nowrap overflow-hidden text-sm text-white",
              shouldMarquee && effectiveIsHovered ? "animate-marquee" : "",
            )}
          >
            {image.caption}
          </div>
        </div>
      )}

      {showOverlays && !selectionMode && (
        <button
          className={cn(
            "absolute right-2 top-2 rounded-sm bg-black/60 p-1.5 backdrop-blur-sm transition-opacity duration-150 hover:bg-black/80",
            effectiveIsHovered ? "opacity-100" : "opacity-0",
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
  );
});
