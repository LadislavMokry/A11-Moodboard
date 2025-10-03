import { Layout } from '@/components/Layout';

export default function Staging() {
  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-start justify-center space-y-2">
        <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Work in progress</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Staging Area</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Drag, drop, and curate your inspirations here. The full experience is coming soon.
        </p>
      </section>
    </Layout>
  );
}

