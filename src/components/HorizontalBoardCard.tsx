import { useUpdateBoard } from "@/hooks/useBoardMutations";
import { type BoardWithImages } from "@/schemas/boardWithImages";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical } from "lucide-react";
import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BoardCardMenu } from "./BoardCardMenu";
import { RotatingBoardCover } from "./RotatingBoardCover";

// Lazy load dialogs - they're only needed when user opens them
const RenameBoardDialog = lazy(() => import("./RenameBoardDialog").then((m) => ({ default: m.RenameBoardDialog })));
const DeleteBoardDialog = lazy(() => import("./DeleteBoardDialog").then((m) => ({ default: m.DeleteBoardDialog })));
const RegenerateShareTokenDialog = lazy(() => import("./RegenerateShareTokenDialog").then((m) => ({ default: m.RegenerateShareTokenDialog })));
const EditCoverDialog = lazy(() => import("./EditCoverDialog").then((m) => ({ default: m.EditCoverDialog })));

type DialogState = "rename" | "delete" | "regenerate" | "editCover" | null;

interface HorizontalBoardCardProps {
  board: BoardWithImages;
  onShare?: (boardId: string) => void;
}

export const HorizontalBoardCard = memo(function HorizontalBoardCard({ board, onShare }: HorizontalBoardCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<DialogState>(null);
  const updateBoard = useUpdateBoard();

  const imageCount = board.images.length;
  const lastUpdated = useMemo(() => formatDistanceToNow(new Date(board.updated_at), { addSuffix: true }), [board.updated_at]);

  const handleToggleRotation = useCallback(async () => {
    try {
      await updateBoard.mutateAsync({
        boardId: board.id,
        updates: {
          cover_rotation_enabled: !board.cover_rotation_enabled
        }
      });
      toast.success(board.cover_rotation_enabled ? "Rotation disabled" : "Rotation enabled");
    } catch (error) {
      console.error("Failed to toggle rotation:", error);
      toast.error("Failed to update rotation setting");
    }
  }, [board.id, board.cover_rotation_enabled, updateBoard]);

  return (
    <div className="group relative flex items-center rounded-lg border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 mb-4">
      <Link
        to={`/boards/${board.id}`}
        className="flex-1 flex items-center p-2 pr-0 overflow-hidden"
      >
        {/* Rotating Board Cover - adapted for 4x1 horizontal layout */}
        <div className="w-32 h-20 flex-shrink-0 rounded-md overflow-hidden relative">
          <RotatingBoardCover
            images={board.images}
            boardName={board.name}
            rotationEnabled={board.cover_rotation_enabled}
            // Adjusting cover for horizontal layout - will need custom styling or a new component
            // For now, it will just show a cropped version of the existing cover logic
          />
        </div>

        {/* Card Info */}
        <div className="flex-1 p-2 overflow-hidden">
          <h3 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">{board.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>
              {imageCount} {imageCount === 1 ? "image" : "images"}
            </span>
            <span>•</span>
            <span>{lastUpdated}</span>
          </div>
        </div>
      </Link>

      {/* Three-dot Menu Button */}
      <div className="flex-shrink-0 p-2">
        <DropdownMenu.Root
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
              }}
              className="rounded-full bg-white/90 p-1.5 text-neutral-700 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:bg-neutral-900"
              aria-label="Board menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <BoardCardMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onRename={() => setDialogOpen("rename")}
            onShare={() => onShare?.(board.id)}
            onRegenerateLink={() => setDialogOpen("regenerate")}
            onDelete={() => setDialogOpen("delete")}
            onEditCover={() => setDialogOpen("editCover")}
            onToggleRotation={handleToggleRotation}
            rotationEnabled={board.cover_rotation_enabled}
          />
        </DropdownMenu.Root>
      </div>

      {/* Dialogs */}
      {dialogOpen === "rename" && (
        <Suspense fallback={null}>
          <RenameBoardDialog
            open={true}
            onOpenChange={(open) => setDialogOpen(open ? "rename" : null)}
            boardId={board.id}
            currentName={board.name}
          />
        </Suspense>
      )}

      {dialogOpen === "delete" && (
        <Suspense fallback={null}>
          <DeleteBoardDialog
            open={true}
            onOpenChange={(open) => setDialogOpen(open ? "delete" : null)}
            boardId={board.id}
            boardName={board.name}
          />
        </Suspense>
      )}

      {dialogOpen === "regenerate" && (
        <Suspense fallback={null}>
          <RegenerateShareTokenDialog
            open={true}
            onOpenChange={(open) => setDialogOpen(open ? "regenerate" : null)}
            boardId={board.id}
            currentShareToken={board.share_token}
          />
        </Suspense>
      )}

      {dialogOpen === "editCover" && (
        <Suspense fallback={null}>
          <EditCoverDialog
            open={true}
            onOpenChange={(open) => setDialogOpen(open ? "editCover" : null)}
            board={board}
          />
        </Suspense>
      )}
    </div>
  );
});
