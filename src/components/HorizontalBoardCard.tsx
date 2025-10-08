import { useUpdateBoard } from "@/hooks/useBoardMutations";
import { type BoardWithImages } from "@/schemas/boardWithImages";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { lazy, memo, Suspense, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BoardCardMenu } from "./BoardCardMenu";
import { RotatingBoardCover } from "./RotatingBoardCover";
import { shuffleArray } from "@/lib/utils";

// Lazy load dialogs - they're only needed when user opens them
const RenameBoardDialog = lazy(() => import("./RenameBoardDialog").then((m) => ({ default: m.RenameBoardDialog })));
const DeleteBoardDialog = lazy(() => import("./DeleteBoardDialog").then((m) => ({ default: m.DeleteBoardDialog })));
const RegenerateShareTokenDialog = lazy(() => import("./RegenerateShareTokenDialog").then((m) => ({ default: m.RegenerateShareTokenDialog })));

type DialogState = "rename" | "delete" | "regenerate" | null;

interface HorizontalBoardCardProps {
  board: BoardWithImages;
  onShare?: (boardId: string) => void;
}

export const HorizontalBoardCard = memo(function HorizontalBoardCard({ board, onShare }: HorizontalBoardCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<DialogState>(null);
  const updateBoard = useUpdateBoard();

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
    <div className="group relative mb-4 flex items-center border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Link
        to={`/boards/${board.id}`}
        className="flex flex-1 items-center gap-4 overflow-hidden p-4"
      >
        <div className="flex-shrink-0">
          <RotatingBoardCover
            images={shuffleArray(board.images)}
            boardName={board.name}
            rotationEnabled={board.cover_rotation_enabled}
            className="h-32 w-32 bg-neutral-200 dark:bg-neutral-800"
            tileClassName="rounded-none"
            roundedTiles={false}
            padded={false}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="block whitespace-normal break-words leading-snug">{board.name}</span>
          </h3>
        </div>
      </Link>

      {/* Three-dot Menu Button */}
      <div className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              className="rounded-full bg-white/90 p-1.5 text-neutral-700 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:bg-neutral-900"
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
    </div>
  );
});
