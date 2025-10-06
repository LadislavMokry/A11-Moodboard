import { ErrorMessage } from "@/components/ErrorMessage";
import { Layout } from "@/components/Layout";
import { LightboxSkeleton } from "@/components/LightboxSkeleton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PublicBoardHeader } from "@/components/PublicBoardHeader";
import { SortableImageGrid } from "@/components/SortableImageGrid";
import { useLightbox } from "@/hooks/useLightbox";
import { usePublicBoard } from "@/hooks/usePublicBoard";
import { type Image } from "@/schemas/image";
import { lazy, Suspense, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

const Lightbox = lazy(() => import("@/components/Lightbox").then((m) => ({ default: m.Lightbox })));

type PublicBoardParams = {
  shareToken: string;
};

export default function PublicBoard() {
  const { shareToken } = useParams<PublicBoardParams>();
  const { data: publicBoardData, isLoading, error } = usePublicBoard(shareToken);

  const board = publicBoardData?.board;
  const owner = publicBoardData?.owner;

  const sortedImages = useMemo(() => (board?.images ? [...board.images].sort((a, b) => a.position - b.position) : []), [board?.images]);

  const lightbox = useLightbox(sortedImages.length);
  const [_editCaptionImage, _setEditCaptionImage] = useState<Image | null>(null);
  const [_deleteImageData, _setDeleteImageData] = useState<Image | null>(null);

  const handleImageClick = (image: Image) => {
    const index = sortedImages.findIndex((img) => img.id === image.id);
    if (index !== -1) {
      lightbox.open(index);
    }
  };

  // 404 - Board not found
  if (error) {
    return (
      <Layout>
        <Helmet>
          <title>Board Not Found - Moodeight</title>
          <meta
            name="robots"
            content="noindex, nofollow"
          />
        </Helmet>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">404</h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">Board not found</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">This board may have been deleted or the link is invalid.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {board && (
        <Helmet>
          <title>{board.name} - Moodeight</title>
          <meta
            name="robots"
            content="noindex, nofollow"
          />

          {/* Open Graph */}
          <meta
            property="og:title"
            content={board.name}
          />
          {board.description && (
            <meta
              property="og:description"
              content={board.description}
            />
          )}
          <meta
            property="og:type"
            content="website"
          />
          <meta
            property="og:url"
            content={window.location.href}
          />
          {/* TODO: Dynamic OG image in Phase 12 */}

          {/* Twitter Card */}
          <meta
            name="twitter:card"
            content="summary_large_image"
          />
          <meta
            name="twitter:title"
            content={board.name}
          />
          {board.description && (
            <meta
              name="twitter:description"
              content={board.description}
            />
          )}
        </Helmet>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner />
          </div>
        )}

        {/* Error state */}
        {error && <ErrorMessage error={error as Error} />}

        {/* Board content */}
        {board && owner && (
          <>
            <PublicBoardHeader
              board={board}
              owner={owner}
            />

            <SortableImageGrid
              boardId={board.id}
              images={board.images}
              onImageClick={handleImageClick}
              onEditCaption={undefined}
              onDelete={undefined}
              selectionMode={false}
              selectedIds={new Set()}
              onToggleSelection={undefined}
              readOnly={true}
            />

            {/* Lightbox */}
            {lightbox.isOpen && sortedImages.length > 0 && (
              <Suspense fallback={<LightboxSkeleton />}>
                <Lightbox
                  images={sortedImages}
                  initialIndex={lightbox.currentIndex}
                  currentIndex={lightbox.currentIndex}
                  onClose={lightbox.close}
                  onNext={lightbox.goToNext}
                  onPrev={lightbox.goToPrev}
                  onJumpTo={lightbox.jumpTo}
                  isOwner={false}
                  onEditCaption={undefined}
                  onDelete={undefined}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
