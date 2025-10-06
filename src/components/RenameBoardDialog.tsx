import { Button } from "@/components/ui/button";
import { useUpdateBoard } from "@/hooks/useBoardMutations";
import { formErrors, trimmedString } from "@/lib/formValidation";
import { toast } from "@/lib/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const renameBoardSchema = z.object({
  name: trimmedString(formErrors.required("Board name")).min(1, formErrors.required("Board name")).max(60, formErrors.maxLength("Board name", 60))
});

type RenameBoardFormValues = z.infer<typeof renameBoardSchema>;

interface RenameBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  currentName: string;
}

export function RenameBoardDialog({ open, onOpenChange, boardId, currentName }: RenameBoardDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RenameBoardFormValues>({
    resolver: zodResolver(renameBoardSchema),
    defaultValues: {
      name: currentName
    }
  });

  const { mutateAsync, isPending } = useUpdateBoard();

  useEffect(() => {
    if (open) {
      reset({ name: currentName });
    }
  }, [open, currentName, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({
        boardId,
        updates: { name: values.name }
      });
      toast.success("Board renamed");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to rename board";
      toast.error(message);
    }
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Rename board</Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400">Give your board a new name.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={onSubmit}
            noValidate
          >
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
                  autoFocus
                  {...register("name")}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  aria-invalid={errors.name ? "true" : "false"}
                />
              </div>
              {errors.name ? (
                <p
                  className="text-xs text-red-500"
                  role="alert"
                >
                  {errors.name.message}
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
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
