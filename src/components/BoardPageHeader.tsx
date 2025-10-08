import { EditableText, type EditableTextHandle } from "@/components/EditableText";
import { SetOgImageDialog } from "@/components/SetOgImageDialog";
import { ShareButton } from "@/components/ShareButton";
import { useUpdateBoard } from "@/hooks/useBoardMutations";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getPublicBoardUrl } from "@/lib/shareUtils";
import { type BoardWithImages } from "@/schemas/boardWithImages";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface BoardPageHeaderProps {
  board: BoardWithImages;
  actions?: ReactNode;
}

export function BoardPageHeader({ board, actions }: BoardPageHeaderProps) {
  const nameEditorRef = useRef<EditableTextHandle>(null);
  const { mutateAsync: updateBoard } = useUpdateBoard();
  const [showOgImageDialog, setShowOgImageDialog] = useState(false);
  const isMobile = useIsMobile();

  const shareUrl = getPublicBoardUrl(board.share_token);

  const handleNameSave = useCallback(
    async (newName: string) => {
      await updateBoard({
        boardId: board.id,
        updates: { name: newName }
      });
    },
    [board.id, updateBoard]
  );

  const handleDescriptionSave = useCallback(
    async (newDescription: string) => {
      await updateBoard({
        boardId: board.id,
        updates: { description: newDescription.length === 0 ? null : newDescription }
      });
    },
    [board.id, updateBoard]
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      if (event.key.toLowerCase() !== "e") {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement.tagName) {
        const tagName = activeElement.tagName.toLowerCase();
        if (["input", "textarea", "select"].includes(tagName) || activeElement.isContentEditable) {
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

    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <header className="mb-8">
      {isMobile ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to boards
          </Link>

          <div className="flex items-center gap-2">
            <ShareButton
              url={shareUrl}
              title={board.name}
              variant="ghost"
              size="icon"
              showLabel={false}
            />
            {actions}
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to boards
          </Link>

          <div className="flex items-center gap-2">
            <ShareButton
              url={shareUrl}
              title={board.name}
              variant="ghost"
              size="sm"
            />
            {actions}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
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
      </div>

      <SetOgImageDialog
        open={showOgImageDialog}
        onOpenChange={setShowOgImageDialog}
        board={board}
      />
    </header>
  );
}
