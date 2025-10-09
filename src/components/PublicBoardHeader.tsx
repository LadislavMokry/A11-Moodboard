import { type BoardWithImages } from '@/schemas/boardWithImages';
import { type PublicBoardOwner } from '@/schemas/publicBoard';
import { ShareButton } from '@/components/ShareButton';
import { getPublicBoardUrl } from '@/lib/shareUtils';

interface PublicBoardHeaderProps {
  board: BoardWithImages;
  owner: PublicBoardOwner;
}

export function PublicBoardHeader({ board, owner }: PublicBoardHeaderProps) {
  const ownerDisplayName = owner.display_name || 'Anonymous';
  const shareUrl = getPublicBoardUrl(board.share_token);

  return (
    <header className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Owner Avatar */}
          {owner.avatar_url ? (
            <img
              src={owner.avatar_url}
              alt={ownerDisplayName}
              className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <span className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                {ownerDisplayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Owner Name */}
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Shared by</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{ownerDisplayName}</p>
          </div>
        </div>

        {/* Share button (mobile) */}
        <ShareButton
          url={shareUrl}
          title={board.name}
          variant="outline"
          size="icon"
          className="md:hidden"
          showLabel={false}
        />
      </div>

      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
            {board.name}
          </h1>
          {board.description && (
            <p className="text-base text-neutral-700 dark:text-neutral-300">{board.description}</p>
          )}
        </div>

        {/* Share button */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-2">
          <ShareButton
            url={shareUrl}
            title={board.name}
            variant="outline"
            size="sm"
            className="gap-2"
          />
        </div>
      </div>


    </header>
  );
}
