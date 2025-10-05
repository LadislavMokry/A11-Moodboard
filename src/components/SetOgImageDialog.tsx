import { useState } from 'react';
import { Image as ImageIcon, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdateBoard } from '@/hooks/useBoardMutations';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import { getSupabaseThumbnail } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface SetOgImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: BoardWithImages;
}

export function SetOgImageDialog({ open, onOpenChange, board }: SetOgImageDialogProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    board.og_image_id || null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const { mutateAsync: updateBoard } = useUpdateBoard();

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateBoard({
        boardId: board.id,
        updates: { og_image_id: selectedImageId },
      });

      toast.success(
        selectedImageId
          ? 'OG preview image updated'
          : 'OG preview image cleared (will use first image)'
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update OG image:', error);
      toast.error('Failed to update OG preview image');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedImageId(null);
  };

  if (board.images.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Preview Image</DialogTitle>
            <DialogDescription>
              Add some images to this board first to set a preview image for social media
              sharing.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Preview Image</DialogTitle>
          <DialogDescription>
            Choose which image to display when sharing this board on social media. If no image
            is selected, the first image will be used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Clear selection button */}
          <Button
            variant={selectedImageId === null ? 'default' : 'outline'}
            onClick={handleClearSelection}
            className="w-full"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Use First Image (Default)
          </Button>

          {/* Image grid */}
          <div className="grid grid-cols-3 gap-3">
            {board.images.map((image) => {
              const isSelected = selectedImageId === image.id;
              const thumbnailUrl = getSupabaseThumbnail(image.storage_path, 360);

              return (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageId(image.id)}
                  className={`
                    relative aspect-square overflow-hidden rounded-md
                    transition-all duration-200
                    ${
                      isSelected
                        ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-neutral-950'
                        : 'hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-600'
                    }
                  `}
                >
                  <img
                    src={thumbnailUrl}
                    alt={image.caption || 'Board image'}
                    className="h-full w-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20">
                      <div className="rounded-full bg-violet-500 p-2">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
