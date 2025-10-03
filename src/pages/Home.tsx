import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { SignInButton } from '@/components/SignInButton';
import { BoardCard } from '@/components/BoardCard';

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    data: boards,
    isLoading: boardsLoading,
    isError,
    error,
    refetch,
  } = useBoards();

  useEffect(() => {
    if (user && !boardsLoading && boards && boards.length === 0) {
      navigate('/staging', { replace: true });
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
        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-10">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">Moodeight</h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-300">
              Collect, arrange, and share your visual inspiration
            </p>
          </div>
          <EmptyState
            icon={<Sparkles className="h-12 w-12" />}
            title="Sign in to start moodboarding"
            description="Bring your ideas to life by creating boards in seconds."
            action={<SignInButton />}
          />
        </section>
      </Layout>
    );
  }

  if (boardsLoading) {
    return (
      <Layout>
        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner message="Loading your boards" />
        </section>
      </Layout>
    );
  }

  if (isError && error) {
    const resolvedError = error instanceof Error ? error : new Error('Failed to load boards');

    return (
      <Layout>
        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <ErrorMessage error={resolvedError} onRetry={() => refetch()} />
        </section>
      </Layout>
    );
  }

  if (user && boards && boards.length === 0) {
    return (
      <Layout>
        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner message="Redirecting to staging" />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Your boards
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Pick up where you left off. Create, curate, and share your visual story.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {boards?.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onShare={(boardId) => {
                // TODO: Implement share functionality
                console.log('Share board:', boardId);
              }}
              onRegenerateLink={(boardId) => {
                // TODO: Implement regenerate link
                console.log('Regenerate link:', boardId);
              }}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
}
