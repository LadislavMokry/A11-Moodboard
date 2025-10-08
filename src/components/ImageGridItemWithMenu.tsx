import { type Image } from "@/schemas/image";
import type { DraggableAttributes } from "@dnd-kit/core";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { ImageGridItem } from "./ImageGridItem";
import { Download, Share2 } from "lucide-react";

type SyntheticListenerMap = Record<string, Function> | undefined;

interface ImageGridItemWithMenuProps {
  image: Image;
  onClick?: () => void;
  onEditCaption?: () => void;
  onDelete?: () => void;
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
  useOriginalSrc?: boolean;
  hoverVariant?: "default" | "download";
  onDownload?: () => void;
  fitStyle?: "cover" | "contain";
  onShare?: () => void;
  showMenu?: boolean;
}

export function ImageGridItemWithMenu({
  image,
  onClick,
  onEditCaption,
  onDelete,
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
  useOriginalSrc = false,
  hoverVariant = "default",
  onDownload,
  onShare,
  fitStyle = "cover",
  showMenu = true,
}: ImageGridItemWithMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch] = useState(() => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0));

  const wrapperStyle = useMemo(() => {
    if (!style) {
      return { position: "relative" } as CSSProperties;
    }
    return {
      position: "relative",
      ...style
    } as CSSProperties;
  }, [style]);

  const itemStyle = useMemo(() => {
    if (!style) {
      return undefined;
    }

    const { gridRowEnd, gridColumnEnd, ...rest } = style;
    if (gridRowEnd === undefined && gridColumnEnd === undefined) {
      return style;
    }

    return Object.keys(rest).length > 0 ? rest : undefined;
  }, [style]);

  const content = (
    <div
      ref={setRef}
      style={wrapperStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ImageGridItem
        image={image}
        onClick={onClick}
        onMenuClick={undefined}
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
        style={itemStyle}
        className={className}
        isDragging={isDragging}
        dataTestId={dataTestId}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
        forceHover={isHovered}
        useOriginalSrc={useOriginalSrc}
        hoverVariant={hoverVariant}
        onDownload={hoverVariant === "download" ? onDownload : undefined}
        fitStyle={fitStyle}
      />

      {!selectionMode && showMenu && (
        <DropdownMenu.Trigger asChild>
          <button
            className={`absolute top-2 right-2 p-1.5 rounded-sm bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-opacity duration-150 ${(isHovered || isTouch) ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
            aria-label="Image options"
            style={{ zIndex: 10 }}
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </DropdownMenu.Trigger>
      )}
    </div>
  );

  if (!showMenu) {
    return content;
  }

  return (
    <DropdownMenu.Root>
      {content}

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          align="end"
          sideOffset={5}
        >
          {onEditCaption && (
            <>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                onClick={(e) => {
                  e.preventDefault();
                  onEditCaption();
                }}
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit caption</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </>
          )}

          {(onShare || onDownload) && onEditCaption && <DropdownMenu.Separator className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />}

          {onShare && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
              onClick={(e) => {
                e.preventDefault();
                onShare();
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>Share image</span>
            </DropdownMenu.Item>
          )}

          {onDownload && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
              onClick={(e) => {
                e.preventDefault();
                onDownload();
              }}
            >
              <Download className="h-4 w-4" />
              <span>Download image</span>
            </DropdownMenu.Item>
          )}

          {(onDownload || onShare) && onDelete && <DropdownMenu.Separator className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />}

          {onDelete && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
