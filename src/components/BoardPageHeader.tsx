import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditableText, type EditableTextHandle } from '@/components/EditableText';
import { useUpdateBoard } from '@/hooks/useBoardMutations';
import { type BoardWithImages } from '@/schemas/boardWithImages';

interface BoardPageHeaderProps {
  board: BoardWithImages;
  actions?: ReactNode;
}

export function BoardPageHeader({ board, actions }: BoardPageHeaderProps) {
  const nameEditorRef = useRef<EditableTextHandle>(null);
  const { mutateAsync: updateBoard } = useUpdateBoard();

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

  const handleNameSave = useCallback(
    async (newName: string) => {
      await updateBoard({
        boardId: board.id,
        updates: { name: newName },
      });
    },
    [board.id, updateBoard],
  );

  const handleDescriptionSave = useCallback(
    async (newDescription: string) => {
      await updateBoard({
        boardId: board.id,
        updates: { description: newDescription.length === 0 ? null : newDescription },
      });
    },
    [board.id, updateBoard],
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      if (event.key.toLowerCase() !== 'e') {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement.tagName) {
        const tagName = activeElement.tagName.toLowerCase();
        if (['input', 'textarea', 'select'].includes(tagName) || activeElement.isContentEditable) {
          return;
        }
      }

      const editor = nameEditorRef.current;
      if (!editor || editor.isEditing()) {
        return;
      }

      event.preventDefault();
      editor.startEditing();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  return (
    <header className="mb-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to boards
      </Link>

      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <EditableText
            ref={nameEditorRef}
            value={board.name}
            onSave={handleNameSave}
            maxLength={60}
            placeholder="Enter a board name"
            label="Board name"
            className="truncate text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
            editClassName="text-3xl font-semibold tracking-tight"
          />
        </div>

        {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div className="space-y-1">
        <EditableText
          value={board.description}
          onSave={handleDescriptionSave}
          maxLength={160}
          multiline
          allowEmpty
          placeholder="Add a description..."
          label="Board description"
          className="text-base text-neutral-700 dark:text-neutral-300"
          editClassName="text-base"
        />

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