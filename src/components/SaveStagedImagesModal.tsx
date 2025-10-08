import { useCreateBoard } from "@/hooks/useBoardMutations";
import { useBoards } from "@/hooks/useBoards";
import type { ImageCreate } from "@/schemas/image";
import { addImageToBoard, uploadImage } from "@/services/images";
import * as Dialog from "@radix-ui/react-dialog";
import { FolderOpen, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";

interface SaveStagedImagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onSuccess: () => void;
}

type SaveMode = "select" | "create";

async function uploadImagesToBoard(files: File[], boardId: string): Promise<void> {
  for (const file of files) {
    // Read image dimensions
    const dimensions = await new Promise<{ width: number | null; height: number | null }>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: null, height: null });
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve({ width: null, height: null });
      reader.readAsDataURL(file);
    });

    // Upload to storage
    const uploadResult = await uploadImage(file, boardId);

    // Add to board
    const imageData: ImageCreate = {
      board_id: boardId,
      storage_path: uploadResult.storagePath,
      position: 1,
      mime_type: uploadResult.mimeType,
      width: dimensions.width,
      height: dimensions.height,
      size_bytes: uploadResult.sizeBytes,
      original_filename: uploadResult.originalFilename,
      source_url: null,
      caption: null
    };

    await addImageToBoard(boardId, imageData);
  }
}

export function SaveStagedImagesModal({ open, onOpenChange, files, onSuccess }: SaveStagedImagesModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SaveMode>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: boards } = useBoards();
  const createBoard = useCreateBoard();

  const filteredBoards = boards?.filter((board) => board.name.toLowerCase().includes(searchQuery.toLowerCase())) ?? [];

  // Reset selected board when switching modes
  useEffect(() => {
    if (mode === "create") {
      setSelectedBoardId(null);
    }
  }, [mode]);

  const handleCreateAndSave = async () => {
    if (!newBoardName.trim()) {
      toast.error("Please enter a board name");
      return;
    }

    setIsUploading(true);
    try {
      const newBoard = await createBoard.mutateAsync({
        name: newBoardName.trim(),
        description: null,
        cover_rotation_enabled: true,
        is_showcase: false
      });

      // Upload images to the new board
      await uploadImagesToBoard(files, newBoard.id);

      toast.success("Board created and images saved!");
      onSuccess();
      navigate(`/boards/${newBoard.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create board");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToExisting = async () => {
    if (!selectedBoardId) {
      toast.error("Please select a board");
      return;
    }

    setIsUploading(true);
    try {
      await uploadImagesToBoard(files, selectedBoardId);
      toast.success("Images saved to board!");
      onSuccess();
      navigate(`/boards/${selectedBoardId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save images");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border border-neutral-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-neutral-800 dark:bg-neutral-900">
          <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Save {files.length} image{files.length === 1 ? "" : "s"}
          </Dialog.Title>

          <Dialog.Description className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Choose where to save your images</Dialog.Description>

          {/* Mode selector */}
          <div className="mt-6 flex gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setMode("select")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "select" ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"}`}
            >
              <FolderOpen className="inline-block h-4 w-4 mr-2" />
              Existing board
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "create" ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"}`}
            >
              <Plus className="inline-block h-4 w-4 mr-2" />
              New board
            </button>
          </div>

          {/* Content based on mode */}
          <div className="mt-6 space-y-4">
            {mode === "select" ? (
              <>
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search boards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder-neutral-400"
                  />
                </div>

                {/* Board list */}
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-950/50">
                  {filteredBoards.length === 0 ? (
                    <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{searchQuery ? "No boards found" : "No boards yet"}</p>
                  ) : (
                    filteredBoards.map((board) => (
                      <button
                        key={board.id}
                        type="button"
                        onClick={() => setSelectedBoardId(board.id)}
                        className={`w-full rounded-md p-3 text-left transition-colors ${selectedBoardId === board.id ? "bg-pink-500 text-white" : "bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"}`}
                      >
                        <div className="font-medium">{board.name}</div>
                        {board.description && <div className={`mt-1 text-sm ${selectedBoardId === board.id ? "text-pink-100" : "text-neutral-500 dark:text-neutral-400"}`}>{board.description}</div>}
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Create new board form */}
                <div>
                  <label
                    htmlFor="board-name"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Board name
                  </label>
                  <input
                    id="board-name"
                    type="text"
                    placeholder="My new moodboard"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    maxLength={60}
                    className="mt-1.5 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder-neutral-400"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{newBoardName.length}/60 characters</p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isUploading}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={mode === "select" ? handleSaveToExisting : handleCreateAndSave}
              disabled={isUploading || (mode === "select" ? !selectedBoardId : !newBoardName.trim())}
              className="flex items-center gap-2 rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading && <LoadingSpinner size="sm" />}
              {isUploading ? "Saving..." : mode === "select" ? "Save to board" : "Create & save"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
