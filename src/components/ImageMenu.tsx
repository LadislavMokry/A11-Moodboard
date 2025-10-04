import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Trash2 } from 'lucide-react';

interface ImageMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditCaption: () => void;
  onDelete: () => void;
}

export function ImageMenu({
  open,
  onOpenChange,
  onEditCaption,
  onDelete,
}: ImageMenuProps) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          align="end"
          sideOffset={5}
        >
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
            onClick={(e) => {
              e.preventDefault();
              onEditCaption();
              onOpenChange(false);
            }}
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit caption</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
