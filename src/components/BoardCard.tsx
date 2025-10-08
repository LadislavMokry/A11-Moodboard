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

type DialogState = "rename" | "delete" | "regenerate" | null;

interface BoardCardProps {
  board: BoardWithImages;
  onShare?: (boardId: string) => void;
}

export const BoardCard = memo(function BoardCard({ board, onShare }: BoardCardProps) {
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
    <div className="group relative">
      <Link
        to={`/boards/${board.id}`}
        className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:scale-[1.02] hover:shadow-xl will-change-transform dark:border-neutral-800 dark:bg-neutral-900"
      >
        {/* Rotating Board Cover */}
        <RotatingBoardCover
          images={board.images}
          boardName={board.name}
          rotationEnabled={board.cover_rotation_enabled}
        />

        {/* Card Info */}
        <div className="p-4">
          <h3 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">{board.name}</h3>
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
      <div className="absolute right-3 top-3">
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
            onToggleRotation={handleToggleRotation}
            rotationEnabled={board.cover_rotation_enabled}
          />
        </DropdownMenu.Root>
      </div>

      {/* Rename Dialog */}
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

      {/* Delete Dialog */}
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

      {/* Regenerate Share Token Dialog */}
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
