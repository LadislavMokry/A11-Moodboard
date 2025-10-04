import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X } from 'lucide-react';
import { useUpdateImage } from '@/hooks/useImageMutations';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MAX_CAPTION_LENGTH = 140;

const editCaptionSchema = z.object({
  caption: z
    .string()
    .max(MAX_CAPTION_LENGTH, `Caption must be ${MAX_CAPTION_LENGTH} characters or less`)
    .optional()
    .transform((val) => val?.trim() || null),
});

type EditCaptionFormValues = z.infer<typeof editCaptionSchema>;

interface EditCaptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  imageId: string;
  currentCaption: string | null;
}

export function EditCaptionDialog({
  open,
  onOpenChange,
  boardId,
  imageId,
  currentCaption,
}: EditCaptionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditCaptionFormValues>({
    resolver: zodResolver(editCaptionSchema),
    defaultValues: {
      caption: currentCaption || '',
    },
  });

  const { mutateAsync, isPending } = useUpdateImage(boardId);

  const captionValue = watch('caption');
  const charCount = captionValue?.length || 0;
  const remaining = MAX_CAPTION_LENGTH - charCount;

  useEffect(() => {
    if (open) {
      reset({ caption: currentCaption || '' });
    }
  }, [open, currentCaption, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({
        imageId,
        updates: { caption: values.caption || null },
      });
      toast.success('Caption updated');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update caption';
      toast.error(message);
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Edit caption
              </Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400">
                Add or edit a caption for this image.
              </Dialog.Description>
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

          <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="caption"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
                >
                  Caption
                </label>
                <span
                  className={`text-xs ${
                    remaining < 0
                      ? 'text-red-500'
                      : remaining < 20
                        ? 'text-amber-500'
                        : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {remaining} left
                </span>
              </div>
              <div className="relative">
                <input
                  id="caption"
                  type="text"
                  autoComplete="off"
                  autoFocus
                  placeholder="Add a caption..."
                  {...register('caption')}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  aria-invalid={errors.caption ? 'true' : 'false'}
                  maxLength={MAX_CAPTION_LENGTH + 10} // Allow typing a bit over for better UX
                />
              </div>
              {errors.caption ? (
                <p className="text-xs text-red-500" role="alert">
                  {errors.caption.message}
                </p>
              ) : null}
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
