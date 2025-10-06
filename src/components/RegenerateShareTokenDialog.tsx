import { Button } from "@/components/ui/button";
import { useRegenerateShareToken } from "@/hooks/useBoardMutations";
import { copyToClipboard } from "@/lib/clipboard";
import { getPublicBoardUrl } from "@/lib/shareUtils";
import { toast } from "@/lib/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Check, Link2, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface RegenerateShareTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  currentShareToken: string;
}

export function RegenerateShareTokenDialog({ open, onOpenChange, boardId, currentShareToken }: RegenerateShareTokenDialogProps) {
  const [regenerated, setRegenerated] = useState(false);
  const [newShareToken, setNewShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { mutateAsync, isPending } = useRegenerateShareToken();

  const currentUrl = getPublicBoardUrl(currentShareToken);
  const newUrl = newShareToken ? getPublicBoardUrl(newShareToken) : null;

  useEffect(() => {
    if (open) {
      setRegenerated(false);
      setNewShareToken(null);
      setCopied(false);
    }
  }, [open]);

  const handleRegenerate = async () => {
    try {
      const updatedBoard = await mutateAsync(boardId);
      setNewShareToken(updatedBoard.share_token);
      setRegenerated(true);
      toast.success("New share link generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to regenerate share link";
      toast.error(message);
    }
  };

  const handleCopyNewLink = async () => {
    if (!newUrl) return;

    try {
      await copyToClipboard(newUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleDone = () => {
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{regenerated ? "New link generated" : "Regenerate share link"}</Dialog.Title>
                <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400">{regenerated ? "Your new share link is ready" : "This will invalidate the old share link"}</Dialog.Description>
              </div>
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

          <div className="mt-6 space-y-4">
            {!regenerated && (
              <>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
                  <p className="text-sm text-amber-800 dark:text-amber-300">This will invalidate the old share link. Anyone with the old link will lose access.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Current share link</label>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">{currentUrl}</p>
                  </div>
                </div>
              </>
            )}

            {regenerated && newUrl && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Old share link (no longer valid)</label>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <p className="truncate text-sm text-neutral-600 line-through dark:text-neutral-400">{currentUrl}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">New share link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 dark:border-pink-800 dark:bg-pink-950/20">
                      <p className="truncate text-sm text-pink-900 dark:text-pink-300">{newUrl}</p>
                    </div>
                    <Button
                      onClick={handleCopyNewLink}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {!regenerated ? (
                <>
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
                    onClick={handleRegenerate}
                    disabled={isPending}
                    className="bg-amber-600 text-white hover:bg-amber-700 focus-visible:outline-amber-600 disabled:bg-amber-600/50 dark:bg-amber-600 dark:hover:bg-amber-700"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate New Link"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleDone}
                  className="bg-pink-600 text-white hover:bg-pink-700 focus-visible:outline-pink-600"
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
