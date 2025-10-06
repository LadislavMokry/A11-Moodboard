import { BoardPageHeader } from "@/components/BoardPageHeader";
import { BoardPageMenu } from "@/components/BoardPageMenu";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImageGridSkeleton } from "@/components/ImageGridSkeleton";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { Layout } from "@/components/Layout";
import { LightboxSkeleton } from "@/components/LightboxSkeleton";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { Skeleton } from "@/components/Skeleton";
import { SortableImageGrid } from "@/components/SortableImageGrid";
import { TransferTarget } from "@/components/TransferTarget";
import { Button } from "@/components/ui/button";
import { SelectionProvider, useSelection } from "@/contexts/SelectionContext";
import { useAuth } from "@/hooks/useAuth";
import { useBoard } from "@/hooks/useBoard";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useLightbox } from "@/hooks/useLightbox";
import { toast } from "@/lib/toast";
import { type Image } from "@/schemas/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type BoardRouteParams = {
  boardId: string;
};

const LightboxLazy = lazy(async () => ({ default: (await import("@/components/Lightbox")).Lightbox }));

const EditCaptionDialogLazy = lazy(async () => ({ default: (await import("@/components/EditCaptionDialog")).EditCaptionDialog }));
const DeleteImageDialogLazy = lazy(async () => ({ default: (await import("@/components/DeleteImageDialog")).DeleteImageDialog }));
const BulkDeleteDialogLazy = lazy(async () => ({ default: (await import("@/components/BulkDeleteDialog")).BulkDeleteDialog }));
const TransferImagesDialogLazy = lazy(async () => ({ default: (await import("@/components/TransferImagesDialog")).TransferImagesDialog }));
const RenameBoardDialogLazy = lazy(async () => ({ default: (await import("@/components/RenameBoardDialog")).RenameBoardDialog }));
const DeleteBoardDialogLazy = lazy(async () => ({ default: (await import("@/components/DeleteBoardDialog")).DeleteBoardDialog }));
const RegenerateShareTokenDialogLazy = lazy(async () => ({ default: (await import("@/components/RegenerateShareTokenDialog")).RegenerateShareTokenDialog }));
const ImportUrlDialogLazy = lazy(async () => ({ default: (await import("@/components/ImportUrlDialog")).ImportUrlDialog }));
const SetOgImageDialogLazy = lazy(async () => ({ default: (await import("@/components/SetOgImageDialog")).SetOgImageDialog }));

const modalFallback = (sizeClass = "h-48 w-[28rem]") => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <Skeleton className={"rounded-2xl " + sizeClass} />
  </div>
);

function BoardPageContent() {
  const { boardId } = useParams<BoardRouteParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: board, isLoading, error } = useBoard(boardId);
  const { uploadImages, handlePaste, uploading, progress, accept } = useImageUpload(board?.id);
  const { selectionMode, selectedIds, toggleSelection, selectAll: _selectAll, enterSelectionMode, exitSelectionMode } = useSelection();

  const [editCaptionImage, setEditCaptionImage] = useState<Image | null>(null);
  const [deleteImageData, setDeleteImageData] = useState<Image | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [showRenameBoardDialog, setShowRenameBoardDialog] = useState(false);
  const [showDeleteBoardDialog, setShowDeleteBoardDialog] = useState(false);
  const [showRegenerateTokenDialog, setShowRegenerateTokenDialog] = useState(false);
  const [showImportUrlDialog, setShowImportUrlDialog] = useState(false);
  const [showOgImageDialog, setShowOgImageDialog] = useState(false);
  const [pastedUrl, setPastedUrl] = useState<string | undefined>();

  const sortedImages = useMemo(() => (board?.images ? [...board.images].sort((a, b) => a.position - b.position) : []), [board?.images]);

  const lightbox = useLightbox(sortedImages.length);

  const isOwner = board && user ? board.owner_id === user.id : false;

  // Redirect non-owners to public board URL
  useEffect(() => {
    if (board && user && !isOwner) {
      navigate(`/b/${board.share_token}`, { replace: true });
    }
  }, [board, user, isOwner, navigate]);

  const activeUploads = useMemo(() => Object.values(progress).filter((value) => value < 100).length, [progress]);

  const handleImageClick = (image: Image) => {
    if (selectionMode) {
      toggleSelection(image.id);
    } else {
      const index = sortedImages.findIndex((img) => img.id === image.id);
      if (index !== -1) {
        lightbox.open(index);
      }
    }
  };

  const handleSelectClick = () => {
    if (selectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const handleBulkDeleteSuccess = () => {
    exitSelectionMode();
  };

  const handleTransfer = () => {
    if (selectedIds.size > 0) {
      setShowTransferDialog(true);
    }
  };

  const handleToggleSelection = (imageId: string) => {
    // Auto-enter selection mode if not already in it
    if (!selectionMode) {
      enterSelectionMode();
    }
    toggleSelection(imageId);
  };

  const handleDeleteSuccess = () => {
    // If lightbox is open and we deleted the current image, close or navigate
    if (lightbox.isOpen && deleteImageData) {
      const currentImage = sortedImages[lightbox.currentIndex];
      if (currentImage?.id === deleteImageData.id) {
        // If it's the last image, close lightbox
        if (sortedImages.length === 1) {
          lightbox.close();
        } else {
          // Navigate to next image (or previous if we're at the end)
          if (lightbox.currentIndex >= sortedImages.length - 1) {
            lightbox.goToPrev();
          } else {
            lightbox.goToNext();
          }
        }
      }
    }
  };

  useClipboardPaste({
    enabled: Boolean(board && isOwner && !uploading),
    onPaste: (files) => {
      if (!board || !isOwner || files.length === 0) {
        return;
      }
      toast.success("Image pasted, uploading...");
      handlePaste(files);
    }
  });

  // Handle URL paste (Ctrl+V with text)
  useEffect(() => {
    if (!board || !isOwner) return;

    const handlePasteUrl = async (e: ClipboardEvent) => {
      // Only handle if no input/textarea is focused
      const activeElement = document.activeElement;
      if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      // Check if it's a valid URL
      try {
        const url = new URL(text);
        if (url.protocol === "http:" || url.protocol === "https:") {
          // Open import dialog with the URL
          setPastedUrl(text);
          setShowImportUrlDialog(true);
        }
      } catch {
        // Not a valid URL, ignore
      }
    };

    window.addEventListener("paste", handlePasteUrl);
    return () => window.removeEventListener("paste", handlePasteUrl);
  }, [board, isOwner]);

  return (
    <Layout>
      <ImageDropZone
        disabled={!board || !isOwner}
        onDropFiles={(files) => {
          if (!isOwner) {
            return;
          }
          if (files.length > 0) {
            uploadImages(files);
          }
        }}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Loading state */}
          {isLoading && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <ImageGridSkeleton count={8} />
            </div>
          )}

          {/* Error state */}
          {error && <ErrorMessage error={error instanceof Error ? error : new Error("Failed to load board")} />}

          {/* Board content */}
          {board && (
            <>
              <BoardPageHeader
                board={board}
                actions={
                  <>
                    {isOwner ? (
                      <>
                        <ImageUploadButton
                          onSelectFiles={(files) => {
                            if (!files) {
                              return;
                            }
                            uploadImages(files);
                          }}
                          uploading={uploading}
                          accept={accept}
                          inProgressCount={activeUploads}
                        />
                        <DropdownMenu.Root
                          open={boardMenuOpen}
                          onOpenChange={setBoardMenuOpen}
                        >
                          <DropdownMenu.Trigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenu.Trigger>
                          <BoardPageMenu
                            open={boardMenuOpen}
                            onOpenChange={setBoardMenuOpen}
                            onRename={() => setShowRenameBoardDialog(true)}
                            onRegenerateLink={() => setShowRegenerateTokenDialog(true)}
                            onSetPreviewImage={() => setShowOgImageDialog(true)}
                            onImportUrl={() => setShowImportUrlDialog(true)}
                            onSelect={handleSelectClick}
                            selectionMode={selectionMode}
                            onDelete={() => setShowDeleteBoardDialog(true)}
                          />
                        </DropdownMenu.Root>
                      </>
                    ) : null}
                  </>
                }
              />

              <SortableImageGrid
                boardId={board.id}
                images={board.images}
                onImageClick={handleImageClick}
                onEditCaption={(image) => setEditCaptionImage(image)}
                onDelete={(image) => setDeleteImageData(image)}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
              />

              {/* Selection Toolbar */}
              {selectionMode && selectedIds.size > 0 && (
                <SelectionToolbar
                  onDelete={handleBulkDelete}
                  onTransfer={handleTransfer}
                />
              )}

              {/* Transfer Target (drag-to-transfer) */}
              <TransferTarget
                show={selectionMode && selectedIds.size > 0}
                onDrop={handleTransfer}
              />

              {/* Lightbox */}
              {lightbox.isOpen && sortedImages.length > 0 && (
                <Suspense fallback={<LightboxSkeleton />}>
                  <LightboxLazy
                    images={sortedImages}
                    initialIndex={lightbox.currentIndex}
                    currentIndex={lightbox.currentIndex}
                    onClose={lightbox.close}
                    onNext={lightbox.goToNext}
                    onPrev={lightbox.goToPrev}
                    onJumpTo={lightbox.jumpTo}
                    isOwner={isOwner}
                    onEditCaption={(image) => setEditCaptionImage(image)}
                    onDelete={(image) => setDeleteImageData(image)}
                  />
                </Suspense>
              )}

              {/* Edit Caption Dialog */}
              {editCaptionImage && (
                <Suspense fallback={modalFallback("h-64 w-[32rem]")}>
                  <EditCaptionDialogLazy
                    open={Boolean(editCaptionImage)}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditCaptionImage(null);
                      }
                    }}
                    boardId={board.id}
                    imageId={editCaptionImage.id}
                    currentCaption={editCaptionImage.caption || null}
                  />
                </Suspense>
              )}

              {/* Delete Image Dialog */}
              {deleteImageData && (
                <Suspense fallback={modalFallback("h-56 w-[28rem]")}>
                  <DeleteImageDialogLazy
                    open={Boolean(deleteImageData)}
                    onOpenChange={(open) => {
                      if (!open) {
                        setDeleteImageData(null);
                      }
                    }}
                    boardId={board.id}
                    image={deleteImageData}
                    onDeleteSuccess={handleDeleteSuccess}
                  />
                </Suspense>
              )}

              {/* Bulk Delete Dialog */}
              {showBulkDeleteDialog && (
                <Suspense fallback={modalFallback("h-64 w-[32rem]")}>
                  <BulkDeleteDialogLazy
                    open={showBulkDeleteDialog}
                    onOpenChange={setShowBulkDeleteDialog}
                    boardId={board.id}
                    imageIds={Array.from(selectedIds)}
                    onDeleteSuccess={handleBulkDeleteSuccess}
                  />
                </Suspense>
              )}

              {/* Transfer Images Dialog */}
              {showTransferDialog && (
                <Suspense fallback={modalFallback("h-72 w-[34rem]")}>
                  <TransferImagesDialogLazy
                    open={showTransferDialog}
                    onOpenChange={setShowTransferDialog}
                    imageIds={Array.from(selectedIds)}
                    sourceBoardId={board.id}
                  />
                </Suspense>
              )}

              {/* Rename Board Dialog */}
              {showRenameBoardDialog && (
                <Suspense fallback={modalFallback("h-56 w-[30rem]")}>
                  <RenameBoardDialogLazy
                    open={showRenameBoardDialog}
                    onOpenChange={setShowRenameBoardDialog}
                    boardId={board.id}
                    currentName={board.name}
                  />
                </Suspense>
              )}

              {/* Delete Board Dialog */}
              {showDeleteBoardDialog && (
                <Suspense fallback={modalFallback("h-60 w-[30rem]")}>
                  <DeleteBoardDialogLazy
                    open={showDeleteBoardDialog}
                    onOpenChange={setShowDeleteBoardDialog}
                    boardId={board.id}
                    boardName={board.name}
                  />
                </Suspense>
              )}

              {/* Regenerate Share Token Dialog */}
              {showRegenerateTokenDialog && (
                <Suspense fallback={modalFallback("h-48 w-[28rem]")}>
                  <RegenerateShareTokenDialogLazy
                    open={showRegenerateTokenDialog}
                    onOpenChange={setShowRegenerateTokenDialog}
                    boardId={board.id}
                    currentShareToken={board.share_token}
                  />
                </Suspense>
              )}

              {/* Import URL Dialog */}
              {showImportUrlDialog && (
                <Suspense fallback={modalFallback("h-72 w-[36rem]")}>
                  <ImportUrlDialogLazy
                    open={showImportUrlDialog}
                    onOpenChange={(open) => {
                      setShowImportUrlDialog(open);
                      if (!open) setPastedUrl(undefined); // Clear pasted URL when closing
                    }}
                    boardId={board.id}
                    initialUrl={pastedUrl}
                  />
                </Suspense>
              )}

              {/* Set OG Image Dialog */}
              {showOgImageDialog && (
                <Suspense fallback={modalFallback("h-80 w-[40rem]")}>
                  <SetOgImageDialogLazy
                    open={showOgImageDialog}
                    onOpenChange={setShowOgImageDialog}
                    board={board}
                  />
                </Suspense>
              )}
            </>
          )}
        </div>
      </ImageDropZone>
    </Layout>
  );
}

export default function BoardPage() {
  return (
    <SelectionProvider>
      <BoardPageContent />
    </SelectionProvider>
  );
}
