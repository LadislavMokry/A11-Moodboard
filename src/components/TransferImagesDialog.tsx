import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { X, Search, Loader2, ArrowRight, Plus } from 'lucide-react';
import { useBoards } from '@/hooks/useBoards';
import { useCreateBoard } from '@/hooks/useBoardMutations';
import { useTransferImages } from '@/hooks/useTransferImages';
import { getSupabaseThumbnail } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { boardCreateSchema } from '@/schemas/board';
import { trimmedString, formErrors } from '@/lib/formValidation';
import type { Board } from '@/schemas/board';

interface TransferImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageIds: string[];
  sourceBoardId: string;
}

const boardFormSchema = z.object({
  name: trimmedString(formErrors.required('Board name'))
    .min(1, formErrors.required('Board name'))
    .max(60, formErrors.maxLength('Board name', 60)),
});

type BoardFormValues = z.infer<typeof boardFormSchema>;

export function TransferImagesDialog({
  open,
  onOpenChange,
  imageIds,
  sourceBoardId,
}: TransferImagesDialogProps) {
  const navigate = useNavigate();
  const [operation, setOperation] = useState<'copy' | 'move'>('copy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: boards = [], isLoading: loadingBoards } = useBoards();
  const { mutateAsync: createBoard, isPending: isCreatingBoard } = useCreateBoard();
  const { mutate: transferImages, isPending: isTransferring } = useTransferImages({
    onSuccess: (destBoardId) => {
      onOpenChange(false);
      if (operation === 'move') {
        navigate(`/boards/${destBoardId}`);
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardFormValues>({
    resolver: zodResolver(boardFormSchema),
    defaultValues: { name: '' },
  });

  // Filter boards (exclude source board and filter by search)
  const availableBoards = boards.filter(
    (board) =>
      board.id !== sourceBoardId &&
      (searchQuery.trim() === '' ||
        board.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTransfer = () => {
    if (!selectedBoardId) return;

    transferImages({
      operation,
      sourceBoardId,
      destBoardId: selectedBoardId,
      imageIds,
    });
  };

  const handleCreateAndTransfer = handleSubmit(async (values) => {
    try {
      const payload = boardCreateSchema.parse({
        name: values.name,
        description: null,
      });

      const newBoard = await createBoard(payload);

      transferImages({
        operation,
        sourceBoardId,
        destBoardId: newBoard.id,
        imageIds,
      });

      reset();
      setShowCreateForm(false);
    } catch (error) {
      // Error handling is done by the mutation
    }
  });

  const handleClose = () => {
    setSearchQuery('');
    setSelectedBoardId(null);
    setShowCreateForm(false);
    setOperation('copy');
    reset();
    onOpenChange(false);
  };

  const isPending = isTransferring || isCreatingBoard;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,500px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Transfer images
              </Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-500 dark:text-neutral-400">
                {imageIds.length} {imageIds.length === 1 ? 'image' : 'images'} selected
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Operation selector */}
          <div className="px-6 pb-4">
            <RadioGroup.Root
              value={operation}
              onValueChange={(value) => setOperation(value as 'copy' | 'move')}
              className="flex gap-3"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroup.Item
                  value="copy"
                  className="h-4 w-4 rounded-full border border-neutral-300 bg-white text-violet-600 hover:border-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-violet-500"
                >
                  <RadioGroup.Indicator className="relative flex h-full w-full items-center justify-center after:block after:h-2 after:w-2 after:rounded-full after:bg-violet-600 dark:after:bg-violet-500" />
                </RadioGroup.Item>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Copy</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroup.Item
                  value="move"
                  className="h-4 w-4 rounded-full border border-neutral-300 bg-white text-violet-600 hover:border-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-violet-500"
                >
                  <RadioGroup.Indicator className="relative flex h-full w-full items-center justify-center after:block after:h-2 after:w-2 after:rounded-full after:bg-violet-600 dark:after:bg-violet-500" />
                </RadioGroup.Item>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Move</span>
              </label>
            </RadioGroup.Root>
          </div>

          {/* Search input */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Boards list */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="space-y-2">
              {/* Create new board option */}
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-neutral-300 hover:border-violet-500 hover:bg-violet-50 transition-colors dark:border-neutral-700 dark:hover:border-violet-500 dark:hover:bg-violet-950/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
                    <Plus className="h-5 w-5 text-violet-600 dark:text-violet-500" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Create new board
                  </span>
                </button>
              ) : (
                <form onSubmit={handleCreateAndTransfer} className="p-4 rounded-lg border border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="new-board-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                        New board name
                      </label>
                      <input
                        id="new-board-name"
                        type="text"
                        autoFocus
                        {...register('name')}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                        placeholder="New moodboard"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 mt-1" role="alert">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isPending}
                        className="flex-1"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Create & Transfer
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateForm(false);
                          reset();
                        }}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Loading state */}
              {loadingBoards && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              )}

              {/* No boards found */}
              {!loadingBoards && availableBoards.length === 0 && searchQuery.trim() !== '' && (
                <p className="text-center py-8 text-sm text-neutral-500 dark:text-neutral-400">
                  No boards found
                </p>
              )}

              {/* Board list */}
              {availableBoards.map((board) => (
                <BoardItem
                  key={board.id}
                  board={board}
                  selected={selectedBoardId === board.id}
                  onSelect={() => setSelectedBoardId(board.id)}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 p-6 dark:border-neutral-800">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isPending}
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTransfer}
              disabled={!selectedBoardId || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  {operation === 'copy' ? 'Copy' : 'Move'} images
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface BoardItemProps {
  board: Board & { images?: Array<{ storage_path: string }> };
  selected: boolean;
  onSelect: () => void;
}

function BoardItem({ board, selected, onSelect }: BoardItemProps) {
  const thumbnailUrl = board.images?.[0]
    ? getSupabaseThumbnail(board.images[0].storage_path, 80)
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
        selected
          ? 'border-violet-500 bg-violet-50 dark:border-violet-500 dark:bg-violet-950/20'
          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-neutral-200 dark:bg-neutral-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {board.name}
        </p>
        {board.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {board.description}
          </p>
        )}
      </div>
    </button>
  );
}
