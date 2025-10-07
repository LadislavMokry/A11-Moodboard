import { Layout } from '@/components/Layout';
import { ProfileForm } from '@/components/ProfileForm';

export default function ProfilePage() {
  return (
    <Layout>
      <section className="mx-auto flex max-w-3xl flex-col gap-8 py-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Profile settings</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Manage your avatar, display name, and preferences.
          </p>
        </div>
        <ProfileForm />
      </section>
    </Layout>
  );
}
