import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteImage } from '@/hooks/useImageMutations';
import { toast } from 'sonner';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  imageIds: string[];
  onDeleteSuccess?: () => void;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  boardId,
  imageIds,
  onDeleteSuccess,
}: BulkDeleteDialogProps) {
  const { mutate: deleteImage, isPending } = useDeleteImage(boardId);

  const imageCount = imageIds.length;

  const handleDelete = () => {
    // For now, delete images one by one
    // TODO: In Phase 11, call delete_images Edge Function with array of IDs
    let deletedCount = 0;
    let errorCount = 0;

    imageIds.forEach((imageId) => {
      deleteImage(
        imageId,
        {
          onSuccess: () => {
            deletedCount++;
            if (deletedCount + errorCount === imageIds.length) {
              if (errorCount === 0) {
                toast.success(`${deletedCount} ${deletedCount === 1 ? 'image' : 'images'} deleted`);
                onDeleteSuccess?.();
                onOpenChange(false);
              } else {
                toast.error(`Deleted ${deletedCount}, failed ${errorCount}`);
                onDeleteSuccess?.();
                onOpenChange(false);
              }
            }
          },
          onError: (error) => {
            errorCount++;
            console.error('Failed to delete image:', error);
            if (deletedCount + errorCount === imageIds.length) {
              if (deletedCount === 0) {
                toast.error(`Failed to delete ${imageCount} ${imageCount === 1 ? 'image' : 'images'}`);
              } else {
                toast.error(`Deleted ${deletedCount}, failed ${errorCount}`);
                onDeleteSuccess?.();
              }
              onOpenChange(false);
            }
          },
        },
      );
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete {imageCount} {imageCount === 1 ? 'image' : 'images'}?
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <p>
              Are you sure you want to delete {imageCount === 1 ? 'this image' : `these ${imageCount} images`}?
            </p>
            <p className="text-red-600 dark:text-red-400 font-medium">
              This action cannot be undone.
            </p>
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              {isPending ? 'Deleting...' : `Delete ${imageCount === 1 ? 'image' : 'images'}`}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
