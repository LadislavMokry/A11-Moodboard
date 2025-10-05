import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateBoard } from '@/hooks/useBoardMutations';
import { boardCreateSchema } from '@/schemas/board';
import { trimmedString, formErrors } from '@/lib/formValidation';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Loader2, Plus, X } from 'lucide-react';

const _descriptionPreprocess = z.preprocess((value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(160, formErrors.maxLength('Description', 160)).nullable());

const boardFormSchema = z.object({
  name: trimmedString(formErrors.required('Board name'))
    .min(1, formErrors.required('Board name'))
    .max(60, formErrors.maxLength('Board name', 60)),
  description: z.string().max(160, formErrors.maxLength('Description', 160)).nullable().optional(),
});

type BoardFormValues = { name: string; description?: string | null | undefined };

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultValues: BoardFormValues = {
  name: '',
  description: '',
};

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardFormValues>({
    resolver: zodResolver(boardFormSchema),
    defaultValues,
  });

  const { mutateAsync, isPending } = useCreateBoard();

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = boardCreateSchema.parse({
        name: values.name,
        description: values.description ?? null,
      });

      const board = await mutateAsync(payload);
      toast.success('Board created');
      onOpenChange(false);
      reset(defaultValues);
      navigate(`/boards/${board.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create board';
      toast.error(message);
    }
  });

  const handleCancel = () => {
    reset(defaultValues);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Create new board
              </Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400">
                Give your board a name and optional description.
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
              <label
                htmlFor="board-name"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Board name
              </label>
              <div className="relative">
                <input
                  id="board-name"
                  type="text"
                  autoComplete="off"
                  {...register('name')}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  placeholder="Inspiration"
                  aria-invalid={errors.name ? 'true' : 'false'}
                />
              </div>
              {errors.name ? (
                <p className="text-xs text-red-500" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="board-description"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Description <span className="text-neutral-400">(optional)</span>
              </label>
              <textarea
                id="board-description"
                rows={3}
                {...register('description')}
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder="What makes this moodboard special?"
                aria-invalid={errors.description ? 'true' : 'false'}
              />
              {errors.description ? (
                <p className="text-xs text-red-500" role="alert">
                  {errors.description.message}
                </p>
              ) : null}
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Max 160 characters.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isPending}
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create board
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
