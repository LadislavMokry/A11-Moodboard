import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, MoreVertical } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { BoardPageHeader } from '@/components/BoardPageHeader';
import { SortableImageGrid } from '@/components/SortableImageGrid';
import { Lightbox } from '@/components/Lightbox';
import { EditCaptionDialog } from '@/components/EditCaptionDialog';
import { DeleteImageDialog } from '@/components/DeleteImageDialog';
import { BulkDeleteDialog } from '@/components/BulkDeleteDialog';
import { SelectionToolbar } from '@/components/SelectionToolbar';
import { TransferImagesDialog } from '@/components/TransferImagesDialog';
import { TransferTarget } from '@/components/TransferTarget';
import { BoardPageMenu } from '@/components/BoardPageMenu';
import { RenameBoardDialog } from '@/components/RenameBoardDialog';
import { DeleteBoardDialog } from '@/components/DeleteBoardDialog';
import { RegenerateShareTokenDialog } from '@/components/RegenerateShareTokenDialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SelectionProvider, useSelection } from '@/contexts/SelectionContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useBoard } from '@/hooks/useBoard';
import { useAuth } from '@/hooks/useAuth';
import { useLightbox } from '@/hooks/useLightbox';
import { Button } from '@/components/ui/button';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { ImageDropZone } from '@/components/ImageDropZone';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { toast } from '@/lib/toast';
import { type Image } from '@/schemas/image';

type BoardRouteParams = {
  boardId: string;
};

function BoardPageContent() {
  const { boardId } = useParams<BoardRouteParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: board, isLoading, error } = useBoard(boardId);
  const { uploadImages, handlePaste, uploading, progress, accept } = useImageUpload(board?.id);
  const {
    selectionMode,
    selectedIds,
    toggleSelection,
    selectAll: _selectAll,
    enterSelectionMode,
    exitSelectionMode,
  } = useSelection();

  const [editCaptionImage, setEditCaptionImage] = useState<Image | null>(null);
  const [deleteImageData, setDeleteImageData] = useState<Image | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [showRenameBoardDialog, setShowRenameBoardDialog] = useState(false);
  const [showDeleteBoardDialog, setShowDeleteBoardDialog] = useState(false);
  const [showRegenerateTokenDialog, setShowRegenerateTokenDialog] = useState(false);

  const sortedImages = useMemo(
    () => (board?.images ? [...board.images].sort((a, b) => a.position - b.position) : []),
    [board?.images],
  );

  const lightbox = useLightbox(sortedImages.length);

  const isOwner = board && user ? board.owner_id === user.id : false;

  // Redirect non-owners to public board URL
  useEffect(() => {
    if (board && user && !isOwner) {
      navigate(`/b/${board.share_token}`, { replace: true });
    }
  }, [board, user, isOwner, navigate]);

  const activeUploads = useMemo(
    () => Object.values(progress).filter((value) => value < 100).length,
    [progress],
  );

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

  const handleShareClick = () => {
    // TODO: Open share dialog (Phase 7)
    console.log('Share clicked');
  };

  useClipboardPaste({
    enabled: Boolean(board && isOwner && !uploading),
    onPaste: (files) => {
      if (!board || !isOwner || files.length === 0) {
        return;
      }
      toast.success('Image pasted, uploading...');
      handlePaste(files);
    },
  });

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
            <div className="flex items-center justify-center min-h-[50vh]">
              <LoadingSpinner />
            </div>
          )}

          {/* Error state */}
          {error && (
            <ErrorMessage
              error={error instanceof Error ? error : new Error('Failed to load board')}
            />
          )}

          {/* Board content */}
          {board && (
            <>
              <BoardPageHeader
                board={board}
                onSelectClick={isOwner ? handleSelectClick : undefined}
                selectionMode={selectionMode}
                actions={
                  <>
                    {isOwner ? (
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
                    ) : null}
                    <Button
                      onClick={handleShareClick}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    {isOwner && (
                      <DropdownMenu.Root open={boardMenuOpen} onOpenChange={setBoardMenuOpen}>
                        <DropdownMenu.Trigger asChild>
                          <Button variant="ghost" size="sm" className="px-2">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenu.Trigger>
                        <BoardPageMenu
                          open={boardMenuOpen}
                          onOpenChange={setBoardMenuOpen}
                          onRename={() => setShowRenameBoardDialog(true)}
                          onRegenerateLink={() => setShowRegenerateTokenDialog(true)}
                          onDelete={() => setShowDeleteBoardDialog(true)}
                        />
                      </DropdownMenu.Root>
                    )}
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
                <SelectionToolbar onDelete={handleBulkDelete} onTransfer={handleTransfer} />
              )}

              {/* Transfer Target (drag-to-transfer) */}
              <TransferTarget
                show={selectionMode && selectedIds.size > 0}
                onDrop={handleTransfer}
              />

              {/* Lightbox */}
              {lightbox.isOpen && sortedImages.length > 0 && (
                <Lightbox
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
              )}

              {/* Edit Caption Dialog */}
              {editCaptionImage && (
                <EditCaptionDialog
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
              )}

              {/* Delete Image Dialog */}
              {deleteImageData && (
                <DeleteImageDialog
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
              )}

              {/* Bulk Delete Dialog */}
              {showBulkDeleteDialog && (
                <BulkDeleteDialog
                  open={showBulkDeleteDialog}
                  onOpenChange={setShowBulkDeleteDialog}
                  boardId={board.id}
                  imageIds={Array.from(selectedIds)}
                  onDeleteSuccess={handleBulkDeleteSuccess}
                />
              )}

              {/* Transfer Images Dialog */}
              {showTransferDialog && (
                <TransferImagesDialog
                  open={showTransferDialog}
                  onOpenChange={setShowTransferDialog}
                  imageIds={Array.from(selectedIds)}
                  sourceBoardId={board.id}
                />
              )}

              {/* Rename Board Dialog */}
              {showRenameBoardDialog && (
                <RenameBoardDialog
                  open={showRenameBoardDialog}
                  onOpenChange={setShowRenameBoardDialog}
                  boardId={board.id}
                  currentName={board.name}
                />
              )}

              {/* Delete Board Dialog */}
              {showDeleteBoardDialog && (
                <DeleteBoardDialog
                  open={showDeleteBoardDialog}
                  onOpenChange={setShowDeleteBoardDialog}
                  boardId={board.id}
                  boardName={board.name}
                />
              )}

              {/* Regenerate Share Token Dialog */}
              {showRegenerateTokenDialog && (
                <RegenerateShareTokenDialog
                  open={showRegenerateTokenDialog}
                  onOpenChange={setShowRegenerateTokenDialog}
                  boardId={board.id}
                  currentShareToken={board.share_token}
                />
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
