import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { ImageGridItem } from './ImageGridItem';
import { type Image } from '@/schemas/image';
import type { DraggableAttributes, SyntheticListenerMap } from '@dnd-kit/core';
import type { CSSProperties } from 'react';

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
}: ImageGridItemWithMenuProps) {
  return (
    <DropdownMenu.Root>
      <div style={{ position: 'relative' }}>
        <ImageGridItem
          image={image}
          onClick={onClick}
          onMenuClick={undefined} // Don't use the built-in menu button
          setRef={setRef}
          dragAttributes={dragAttributes}
          dragListeners={dragListeners}
          style={style}
          className={className}
          isDragging={isDragging}
          dataTestId={dataTestId}
        />

        {/* Render our own menu trigger button */}
        <DropdownMenu.Trigger asChild>
          <button
            className="absolute top-2 right-2 p-1.5 rounded-sm bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-opacity duration-150 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
            }}
            aria-label="Image options"
            style={{ zIndex: 10 }}
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </DropdownMenu.Trigger>
      </div>

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
