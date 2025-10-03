import { Layout } from '@/components/Layout';
import { useParams } from 'react-router-dom';

type PublicBoardParams = {
  shareToken: string;
};

export default function PublicBoard() {
  const { shareToken } = useParams<PublicBoardParams>();

  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center space-y-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Public board</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Shared board preview
          </h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-300">
          Token:
          {' '}
          <span className="font-mono text-sm text-neutral-800 dark:text-neutral-200">{shareToken ?? 'unknown'}</span>
        </p>
        <p className="text-neutral-600 dark:text-neutral-300">
          Visitors will see a read-only gallery here once public sharing is implemented.
        </p>
      </section>
    </Layout>
  );
}

