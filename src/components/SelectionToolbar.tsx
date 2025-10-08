import { Trash2, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelection } from '@/contexts/SelectionContext';
import { useIsMobile } from '@/hooks/useIsMobile';

interface SelectionToolbarProps {
  onDelete: () => void;
  onTransfer: () => void;
}

export function SelectionToolbar({ onDelete, onTransfer }: SelectionToolbarProps) {
  const { selectedIds, deselectAll, exitSelectionMode } = useSelection();
  const isMobile = useIsMobile();

  const selectedCount = selectedIds.size;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={
        isMobile
          ? 'fixed inset-x-4 bottom-4 z-50'
          : 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50'
      }
    >
      <div
        className={
          isMobile
            ? 'flex items-center justify-between gap-2 rounded-lg bg-neutral-900/95 px-4 py-3 shadow-lg border border-neutral-700 dark:border-neutral-600'
            : 'flex items-center gap-2 px-4 py-3 rounded-lg bg-neutral-900 dark:bg-neutral-800 shadow-lg border border-neutral-700 dark:border-neutral-600'
        }
      >
        <span
          className={
            isMobile
              ? 'text-xs font-medium text-white mr-1'
              : 'text-sm font-medium text-white mr-2'
          }
        >
          {selectedCount} {selectedCount === 1 ? 'image' : 'images'} selected
        </span>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            onClick={deselectAll}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            {isMobile ? 'Deselect' : 'Deselect all'}
          </Button>

          <Button
            onClick={onTransfer}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            {isMobile ? (
              <span className="flex items-center gap-1">
                <ArrowRight className="w-4 h-4" />
                Move/Copy
              </span>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Move/Copy to...
              </>
            )}
          </Button>

          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
            aria-label="Delete selected images"
          >
            <Trash2 className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Delete</span>}
          </Button>

          {!isMobile && (
            <>
              <div className="w-px h-6 bg-neutral-700 dark:bg-neutral-600 mx-1" />
              <Button
                onClick={exitSelectionMode}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
