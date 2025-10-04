import { useMemo, useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { type BoardWithImages } from '@/schemas/boardWithImages';
import { type PublicBoardOwner } from '@/schemas/publicBoard';

interface PublicBoardHeaderProps {
  board: BoardWithImages;
  owner: PublicBoardOwner;
}

export function PublicBoardHeader({ board, owner }: PublicBoardHeaderProps) {
  const [copied, setCopied] = useState(false);

  const lastUpdated = useMemo(
    () =>
      new Date(board.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [board.updated_at],
  );

  const imageCount = board.images.length;
  const ownerDisplayName = owner.display_name || 'Anonymous';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <header className="mb-8">
      <div className="mb-4 flex items-center gap-3">
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
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-500">
        <span>
          {imageCount} {imageCount === 1 ? 'image' : 'images'}
        </span>
        <span>•</span>
        <span>Updated {lastUpdated}</span>
      </div>
    </header>
  );
}
