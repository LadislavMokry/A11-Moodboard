import { getSupabaseThumbnail } from "@/lib/imageUtils";
import { type BoardWithImages } from "@/schemas/boardWithImages";
import { setBoardCoverImages } from "@/services/boardCoverImages";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: BoardWithImages;
}

/**
 * Dialog for editing board cover images
 * User can select up to 12 images from the board to use in the rotating cover
 */
export function EditCoverDialog({ open, onOpenChange, board }: EditCoverDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const toggleImage = (imageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        if (next.size >= 12) {
          toast.error("Maximum 12 cover images allowed");
          return prev;
        }
        next.add(imageId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setBoardCoverImages(board.id, Array.from(selectedIds));

      // Invalidate queries to refetch board data
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      await queryClient.invalidateQueries({ queryKey: ["board", board.id] });

      toast.success("Cover images updated");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save cover images:", error);
      toast.error("Failed to save cover images");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      await setBoardCoverImages(board.id, []);

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      await queryClient.invalidateQueries({ queryKey: ["board", board.id] });

      setSelectedIds(new Set());
      toast.success("Cover images cleared");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to clear cover images:", error);
      toast.error("Failed to clear cover images");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Edit Cover Images</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Select up to 12 images to display in the rotating board cover. If no images are selected, all board images will be used.</Dialog.Description>

          {/* Image Grid */}
          <div className="mb-6 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            {board.images.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">No images in this board yet. Upload some images first.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {board.images.map((image) => {
                  const isSelected = selectedIds.has(image.id);
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => toggleImage(image.id)}
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${isSelected ? "border-pink-500 ring-2 ring-pink-500/20" : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"}`}
                    >
                      <img
                        src={getSupabaseThumbnail(image.storage_path, 360)}
                        alt={image.caption || board.name}
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20">
                          <div className="rounded-full bg-pink-500 p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selection Count */}
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">{selectedIds.size} of 12 images selected</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || board.images.length === 0}
              className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
