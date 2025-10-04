import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelection } from '@/contexts/SelectionContext';

interface SelectionToolbarProps {
  onDelete: () => void;
}

export function SelectionToolbar({ onDelete }: SelectionToolbarProps) {
  const { selectedIds, deselectAll, exitSelectionMode } = useSelection();

  const selectedCount = selectedIds.size;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-neutral-900 dark:bg-neutral-800 shadow-lg border border-neutral-700 dark:border-neutral-600">
        <span className="text-sm font-medium text-white mr-2">
          {selectedCount} {selectedCount === 1 ? 'image' : 'images'} selected
        </span>

        <Button
          onClick={deselectAll}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-neutral-800 dark:hover:bg-neutral-700"
        >
          Deselect all
        </Button>

        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>

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
      </div>
    </div>
  );
}
