import { BoardCard } from "@/components/BoardCard";
import { BoardCardSkeleton } from "@/components/BoardCardSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { HorizontalBoardCard } from "@/components/HorizontalBoardCard";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShowcaseBoard } from "@/components/ShowcaseBoard";
import { SignInButton } from "@/components/SignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useBoards } from "@/hooks/useBoards";
import { getPublicBoardUrl } from "@/lib/shareUtils";
import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ShareDialog = lazy(() => import("@/components/ShareDialog").then((m) => ({ default: m.ShareDialog })));

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [shareDialogBoard, setShareDialogBoard] = useState<{ id: string; name: string; shareToken: string } | null>(null);
  const { data: boards, isLoading: boardsLoading, isError, error, refetch } = useBoards();

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
        <section className="h-[calc(100vh-4rem)] px-4 py-8 md:py-12">
          {/* Desktop: Two-column layout with waterfall on left | Mobile: Single column */}
          <div className="mx-auto flex h-full max-w-7xl gap-8 md:gap-12">
            {/* Showcase Board - Left side, takes most of the width */}
            <div className="flex-1 md:w-3/5 lg:w-4/6">
              <ShowcaseBoard />
            </div>

            {/* Hero Content - Right side, narrower */}
            <div className="hidden md:flex flex-col justify-center gap-8 text-center md:w-2/5 lg:w-2/6">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-5xl">Capture your vibe.</h1>
                <p className="text-base text-neutral-600 dark:text-neutral-300 md:text-lg">Drop images and arrange them into living moodboards. Share instantly with a single link.</p>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => navigate("/staging")}
                  className="rounded-lg bg-pink-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-pink-700"
                >
                  Create a board
                </button>
                <SignInButton />
              </div>
            </div>

            {/* Mobile: Hero content below waterfall */}
            <div className="md:hidden flex flex-col items-center justify-center gap-8 text-center mt-8">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Capture your vibe.</h1>
                <p className="text-base text-neutral-600 dark:text-neutral-300">Drop images and arrange them into living moodboards. Share instantly with a single link.</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate("/staging")}
                  className="rounded-lg bg-pink-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-pink-700"
                >
                  Create a board
                </button>
                <SignInButton />
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Logged-in user homepage
  return (
    <Layout>
              <section className="flex">        {/* Left column: Horizontal Board Cards */}
        <div className="w-1/3 p-4 overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4">Your Boards</h2>
          {boardsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-4 animate-pulse" />
            ))
          ) : isError ? (
            <ErrorMessage error={error} onRetry={() => refetch()} />
          ) : boards && boards.length > 0 ? (
            boards.map((board) => (
              <HorizontalBoardCard
                key={board.id}
                board={board}
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
            ))
          ) : (
            <p className="text-neutral-500">No boards yet. Create one!</p>
          )}
        </div>

        {/* Right column: Waterfall Showcase */}
        <div className="w-2/3">
          <ShowcaseBoard userId={user.id} />
        </div>
      </section>
    </Layout>
  );
}