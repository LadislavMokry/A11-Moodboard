import { ErrorMessage } from "@/components/ErrorMessage";
import { HorizontalBoardCard } from "@/components/HorizontalBoardCard";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShowcaseBoard } from "@/components/ShowcaseBoard";
import { SignInButton } from "@/components/SignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useBoards } from "@/hooks/useBoards";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getPublicBoardUrl } from "@/lib/shareUtils";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const ShareDialog = lazy(() => import("@/components/ShareDialog").then((m) => ({ default: m.ShareDialog })));

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [shareDialogBoard, setShareDialogBoard] = useState<{ id: string; name: string; shareToken: string } | null>(null);
  const { data: boards, isLoading: boardsLoading, isError, error, refetch } = useBoards();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user && !boardsLoading && boards && boards.length === 0) {
      navigate("/staging", { replace: true });
    }
  }, [user, boards, boardsLoading, navigate]);

  if (loading) {
    return (
      <Layout>
        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner message="Loading your session" />
        </section>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-8 px-4 py-6 md:h-[calc(100vh-4rem)] md:gap-10 md:py-[5vh]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:flex-row md:items-stretch md:gap-12">
            <div className="flex flex-col items-center gap-6 text-center md:order-2 md:w-2/5 md:items-start md:gap-8 md:text-left lg:w-2/6">
              <div className="space-y-4 md:space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-5xl">
                  Capture your vibe.
                </h1>
                <p className="text-base text-neutral-600 dark:text-neutral-300 md:text-lg">
                  Drop images and arrange them into living moodboards. Share instantly with a single link.
                </p>
              </div>
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <button
                  onClick={() => navigate("/staging")}
                  className="rounded-lg bg-[#ff01eb] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#d000c5]"
                >
                  Create a board
                </button>
                <SignInButton className="w-full sm:w-auto" />
              </div>
            </div>

            <div className="h-[60vh] w-full overflow-hidden md:order-1 md:h-full md:w-2/3">
              <ShowcaseBoard />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const listContainerClasses = "flex flex-col gap-4 overflow-y-auto pb-4";
  const boardCardClass = isMobile ? "w-full" : "md:w-full";

  let boardListContent: ReactNode;

  if (boardsLoading) {
    boardListContent = (
      <div className={`${listContainerClasses} mt-4`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex w-full items-center gap-4 border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <div className="h-32 w-32 animate-pulse bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (isError) {
    boardListContent = (
      <div className="mt-4">
        <ErrorMessage error={error} onRetry={() => refetch()} />
      </div>
    );
  } else if (boards && boards.length > 0) {
    boardListContent = (
      <div className={`${listContainerClasses} mt-4`}>
        {boards.map((board) => (
          <HorizontalBoardCard
            key={board.id}
            board={board}
            className={boardCardClass}
            onShare={(boardId) => {
              const targetBoard = boards.find((b) => b.id === boardId);
              if (targetBoard) {
                setShareDialogBoard({
                  id: targetBoard.id,
                  name: targetBoard.name,
                  shareToken: targetBoard.share_token
                });
              }
            }}
          />
        ))}
      </div>
    );
  } else {
    boardListContent = <p className="mt-4 text-neutral-500">No boards yet. Create one!</p>;
  }

  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 border-b border-neutral-200 px-4 py-6 dark:border-neutral-800 md:h-[calc(100vh-4rem)] md:flex-row md:gap-10 md:py-[5vh]">
        <div className="w-full md:w-1/3 md:max-h-full md:overflow-y-auto md:pr-4">
          <h2 className="text-2xl font-semibold">Your Boards</h2>
          {boardListContent}
        </div>

        <div className="h-[60vh] w-full overflow-hidden md:h-full md:w-2/3">
          <ShowcaseBoard userId={user.id} />
        </div>
      </section>

      {shareDialogBoard && (
        <Suspense fallback={null}>
          <ShareDialog
            open={Boolean(shareDialogBoard)}
            onOpenChange={(open) => {
              if (!open) {
                setShareDialogBoard(null);
              }
            }}
            url={getPublicBoardUrl(shareDialogBoard.shareToken)}
            title={shareDialogBoard.name}
          />
        </Suspense>
      )}
    </Layout>
  );
}
