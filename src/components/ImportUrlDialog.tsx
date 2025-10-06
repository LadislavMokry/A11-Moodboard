import { Button } from "@/components/ui/button";
import { useImportFromUrl } from "@/hooks/useImportFromUrl";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { Link as LinkIcon, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const importUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  caption: z.string().max(140, "Caption must be 140 characters or less").optional()
});

type ImportUrlFormValues = z.infer<typeof importUrlSchema>;

interface ImportUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  initialUrl?: string;
}

export function ImportUrlDialog({ open, onOpenChange, boardId, initialUrl }: ImportUrlDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { mutateAsync: importFromUrl } = useImportFromUrl(boardId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ImportUrlFormValues>({
    resolver: zodResolver(importUrlSchema),
    defaultValues: {
      url: "",
      caption: ""
    }
  });

  // Set initial URL when dialog opens
  useEffect(() => {
    if (open && initialUrl) {
      setValue("url", initialUrl);
    } else if (open) {
      reset({ url: "", caption: "" });
    }
  }, [open, initialUrl, setValue, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setIsImporting(true);
    try {
      await importFromUrl({
        boardId,
        imageUrl: values.url,
        caption: values.caption || null
      });
      reset();
      onOpenChange(false);
    } catch (_error) {
      // Error handling is done in the mutation
    } finally {
      setIsImporting(false);
    }
  });

  const handleClose = () => {
    if (!isImporting) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleClose}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Import from URL
              </Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Enter an image URL to import it to your board</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isImporting}
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="url"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Image URL
              </label>
              <input
                id="url"
                type="url"
                autoFocus
                placeholder="https://example.com/image.jpg"
                disabled={isImporting}
                {...register("url")}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 disabled:opacity-50"
                aria-invalid={errors.url ? "true" : "false"}
              />
              {errors.url && (
                <p
                  className="text-xs text-red-500"
                  role="alert"
                >
                  {errors.url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="caption"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Caption (optional)
              </label>
              <input
                id="caption"
                type="text"
                placeholder="Add a caption..."
                disabled={isImporting}
                {...register("caption")}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 disabled:opacity-50"
                maxLength={140}
              />
              {errors.caption && (
                <p
                  className="text-xs text-red-500"
                  role="alert"
                >
                  {errors.caption.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Supported: JPG, PNG, WebP, GIF (max 10 MB)</p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isImporting}
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
