import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import { BoardCardMenu } from './BoardCardMenu';
import { RenameBoardDialog } from './RenameBoardDialog';
import { DeleteBoardDialog } from './DeleteBoardDialog';
import { RegenerateShareTokenDialog } from './RegenerateShareTokenDialog';
import { EditCoverDialog } from './EditCoverDialog';
import { RotatingBoardCover } from './RotatingBoardCover';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUpdateBoard } from '@/hooks/useBoardMutations';
import { toast } from 'sonner';

type DialogState = 'rename' | 'delete' | 'regenerate' | 'editCover' | null;

interface BoardCardProps {
  board: BoardWithImages;
  onShare?: (boardId: string) => void;
}

export function BoardCard({
  board,
  onShare,
}: BoardCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<DialogState>(null);
  const updateBoard = useUpdateBoard();

  const imageCount = board.images.length;
  const lastUpdated = formatDistanceToNow(new Date(board.updated_at), { addSuffix: true });

  const handleToggleRotation = async () => {
    try {
      await updateBoard.mutateAsync({
        boardId: board.id,
        updates: {
          cover_rotation_enabled: !board.cover_rotation_enabled,
        },
      });
      toast.success(
        board.cover_rotation_enabled ? 'Rotation disabled' : 'Rotation enabled'
      );
    } catch (error) {
      console.error('Failed to toggle rotation:', error);
      toast.error('Failed to update rotation setting');
    }
  };

  return (
    <div className="group relative">
      <Link
        to={`/boards/${board.id}`}
        className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:scale-[1.02] hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        {/* Rotating Board Cover */}
        <RotatingBoardCover
          images={board.images}
          boardName={board.name}
          rotationEnabled={board.cover_rotation_enabled}
        />

        {/* Card Info */}
        <div className="p-4">
          <h3 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {board.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>
              {imageCount} {imageCount === 1 ? 'image' : 'images'}
            </span>
            <span>•</span>
            <span>{lastUpdated}</span>
          </div>
        </div>
      </Link>

      {/* Three-dot Menu Button */}
      <div className="absolute right-3 top-3">
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
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
            onRename={() => setDialogOpen('rename')}
            onShare={() => onShare?.(board.id)}
            onRegenerateLink={() => setDialogOpen('regenerate')}
            onDelete={() => setDialogOpen('delete')}
            onEditCover={() => setDialogOpen('editCover')}
            onToggleRotation={handleToggleRotation}
            rotationEnabled={board.cover_rotation_enabled}
          />
        </DropdownMenu.Root>
      </div>

      {/* Rename Dialog */}
      <RenameBoardDialog
        open={dialogOpen === 'rename'}
        onOpenChange={(open) => setDialogOpen(open ? 'rename' : null)}
        boardId={board.id}
        currentName={board.name}
      />

      {/* Delete Dialog */}
      <DeleteBoardDialog
        open={dialogOpen === 'delete'}
        onOpenChange={(open) => setDialogOpen(open ? 'delete' : null)}
        boardId={board.id}
        boardName={board.name}
      />

      {/* Regenerate Share Token Dialog */}
      <RegenerateShareTokenDialog
        open={dialogOpen === 'regenerate'}
        onOpenChange={(open) => setDialogOpen(open ? 'regenerate' : null)}
        boardId={board.id}
        currentShareToken={board.share_token}
      />

      {/* Edit Cover Dialog */}
      <EditCoverDialog
        open={dialogOpen === 'editCover'}
        onOpenChange={(open) => setDialogOpen(open ? 'editCover' : null)}
        board={board}
      />
    </div>
  );
}
