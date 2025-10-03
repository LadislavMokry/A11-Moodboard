import { Layout } from '@/components/Layout';
import { useParams } from 'react-router-dom';

type BoardRouteParams = {
  boardId: string;
};

export default function BoardPage() {
  const { boardId } = useParams<BoardRouteParams>();

  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center space-y-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Private board</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Board #{boardId ?? 'unknown'}
          </h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-300">
          This is the owner view for board <span className="font-medium text-neutral-800 dark:text-neutral-100">{boardId}</span>.
          Detailed editing tools will arrive in a later phase.
        </p>
      </section>
    </Layout>
  );
}

