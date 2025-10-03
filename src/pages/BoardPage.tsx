import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, MoreVertical } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { BoardPageHeader } from '@/components/BoardPageHeader';
import { SortableImageGrid } from '@/components/SortableImageGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useBoard } from '@/hooks/useBoard';
import { useAuth } from '@/hooks/useAuth';
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

export default function BoardPage() {
  const { boardId } = useParams<BoardRouteParams>();
  const { user } = useAuth();
  const { data: board, isLoading, error } = useBoard(boardId);
  const { uploadImages, handlePaste, uploading, progress, accept } = useImageUpload(board?.id);

  const isOwner = board && user ? board.owner_id === user.id : false;

  const activeUploads = useMemo(
    () => Object.values(progress).filter((value) => value < 100).length,
    [progress],
  );

  const handleImageClick = (image: Image) => {
    // TODO: Open lightbox (Phase 6)
    console.log('Image clicked:', image.id);
  };

  const handleImageMenuClick = (image: Image, _event: React.MouseEvent) => {
    // TODO: Open image menu (caption edit, delete, etc.)
    console.log('Image menu clicked:', image.id);
  };

  const handleShareClick = () => {
    // TODO: Open share dialog (Phase 7)
    console.log('Share clicked');
  };

  const handleMenuClick = () => {
    // TODO: Open board menu (rename, delete, etc.)
    console.log('Board menu clicked');
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
                    <Button
                      onClick={handleMenuClick}
                      variant="ghost"
                      size="sm"
                      className="px-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </>
                }
              />

              <SortableImageGrid
                boardId={board.id}
                images={board.images}
                onImageClick={handleImageClick}
                onImageMenuClick={handleImageMenuClick}
              />
            </>
          )}
        </div>
      </ImageDropZone>
    </Layout>
  );
}
