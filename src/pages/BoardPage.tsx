import { useParams } from 'react-router-dom';
import { Upload, Share2, MoreVertical } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { BoardPageHeader } from '@/components/BoardPageHeader';
import { ImageGrid } from '@/components/ImageGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useBoard } from '@/hooks/useBoard';
import { Button } from '@/components/ui/button';
import { type Image } from '@/schemas/image';

type BoardRouteParams = {
  boardId: string;
};

export default function BoardPage() {
  const { boardId } = useParams<BoardRouteParams>();
  const { data: board, isLoading, error } = useBoard(boardId);

  const handleImageClick = (image: Image) => {
    // TODO: Open lightbox (Phase 6)
    console.log('Image clicked:', image.id);
  };

  const handleImageMenuClick = (image: Image, _event: React.MouseEvent) => {
    // TODO: Open image menu (caption edit, delete, etc.)
    console.log('Image menu clicked:', image.id);
  };

  const handleUploadClick = () => {
    // TODO: Open upload dialog (Phase 5.2)
    console.log('Upload clicked');
  };

  const handleShareClick = () => {
    // TODO: Open share dialog (Phase 7)
    console.log('Share clicked');
  };

  const handleMenuClick = () => {
    // TODO: Open board menu (rename, delete, etc.)
    console.log('Board menu clicked');
  };

  return (
    <Layout>
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
                  <Button
                    onClick={handleUploadClick}
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
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

            <ImageGrid
              images={board.images}
              onImageClick={handleImageClick}
              onImageMenuClick={handleImageMenuClick}
            />
          </>
        )}
      </div>
    </Layout>
  );
}

