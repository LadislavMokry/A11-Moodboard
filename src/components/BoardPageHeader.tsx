import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type BoardWithImages } from '@/schemas/boardWithImages';

interface BoardPageHeaderProps {
  board: BoardWithImages;
  actions?: ReactNode;
}

export function BoardPageHeader({ board, actions }: BoardPageHeaderProps) {
  const lastUpdated = new Date(board.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const imageCount = board.images.length;

  return (
    <header className="mb-8">
      {/* Back button / breadcrumb */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to boards
      </Link>

      {/* Board title and metadata */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
            {board.name}
          </h1>
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Description and metadata */}
      <div className="space-y-1">
        {board.description && (
          <p className="text-neutral-700 dark:text-neutral-300">
            {board.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-500">
          <span>
            {imageCount} {imageCount === 1 ? 'image' : 'images'}
          </span>
          <span>•</span>
          <span>Updated {lastUpdated}</span>
        </div>
      </div>
    </header>
  );
}
