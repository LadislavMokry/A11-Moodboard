import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Image as ImageIcon } from 'lucide-react';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import { getSupabaseThumbnail } from '@/lib/imageUtils';
import { BoardCardMenu } from './BoardCardMenu';
import { RenameBoardDialog } from './RenameBoardDialog';
import { DeleteBoardDialog } from './DeleteBoardDialog';
import { useState } from 'react';

type DialogState = 'rename' | 'delete' | null;

interface BoardCardProps {
  board: BoardWithImages;
  onShare?: (boardId: string) => void;
  onRegenerateLink?: (boardId: string) => void;
}

export function BoardCard({
  board,
  onShare,
  onRegenerateLink,
}: BoardCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<DialogState>(null);

  const images = board.images.slice(0, 4);
  const imageCount = board.images.length;
  const lastUpdated = formatDistanceToNow(new Date(board.updated_at), { addSuffix: true });

  const thumbnails = images.map((img) => ({
    src: getSupabaseThumbnail(img.storage_path, 360),
    alt: img.caption || board.name,
  }));

  // Fill empty slots if less than 4 images
  while (thumbnails.length < 4) {
    thumbnails.push({ src: '', alt: '' });
  }

  return (
    <div className="group relative">
      <Link
        to={`/boards/${board.id}`}
        className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:scale-[1.02] hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        {/* Thumbnail Grid */}
        <div className="grid aspect-square grid-cols-2 gap-1 bg-neutral-100 p-1 dark:bg-neutral-800">
          {imageCount === 0 ? (
            <div className="col-span-2 row-span-2 flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
            </div>
          ) : (
            thumbnails.map((thumb, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-700"
              >
                {thumb.src ? (
                  <img
                    src={thumb.src}
                    alt={thumb.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-200 dark:bg-neutral-700" />
                )}
              </div>
            ))
          )}
        </div>

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
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(true);
          }}
          className="rounded-full bg-white/90 p-1.5 text-neutral-700 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:bg-neutral-900"
          aria-label="Board menu"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Menu Dropdown */}
      <BoardCardMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onRename={() => setDialogOpen('rename')}
        onShare={() => onShare?.(board.id)}
        onRegenerateLink={() => onRegenerateLink?.(board.id)}
        onDelete={() => setDialogOpen('delete')}
      />

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
    </div>
  );
}
