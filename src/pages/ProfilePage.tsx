import { Layout } from '@/components/Layout';

export default function ProfilePage() {
  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center space-y-3">
        <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Account</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Profile settings</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Manage your avatar, display name, and preferences. This section will evolve in upcoming phases.
        </p>
      </section>
    </Layout>
  );
}

