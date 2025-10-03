import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { useDeleteBoard } from '@/hooks/useBoardMutations';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

interface DeleteBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  boardName: string;
}

export function DeleteBoardDialog({
  open,
  onOpenChange,
  boardId,
  boardName,
}: DeleteBoardDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync, isPending } = useDeleteBoard();

  const isNameMatch = confirmName.trim() === boardName;
  const isOnBoardPage = location.pathname.startsWith(`/boards/${boardId}`);

  useEffect(() => {
    if (open) {
      setConfirmName('');
    }
  }, [open]);

  const handleDelete = async () => {
    if (!isNameMatch) return;

    try {
      await mutateAsync(boardId);
      toast.success('Board deleted');
      onOpenChange(false);

      // Navigate to home if currently on the deleted board's page
      if (isOnBoardPage) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete board';
      toast.error(message);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Delete board
                </Dialog.Title>
                <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400">
                  This action cannot be undone.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
              <p className="text-sm text-red-800 dark:text-red-300">
                This will permanently delete all images and data associated with this board.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-name"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Type <span className="font-semibold">{boardName}</span> to confirm
              </label>
              <input
                id="confirm-name"
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
                autoFocus
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder={boardName}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={!isNameMatch || isPending}
                className="bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-red-600/50 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete board'
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
