import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { SignInButton } from '@/components/SignInButton';
import { Layout } from '@/components/Layout';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();

  const renderLoading = () => (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
    </div>
  );

  if (loading || (user && profileLoading)) {
    return <Layout>{renderLoading()}</Layout>;
  }

  return (
    <Layout>
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Moodeight</h1>
        <p className="text-lg text-gray-400">Collect, arrange, and share your visual inspiration</p>
      </div>

      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-6">
        {user ? (
          <div className="space-y-4 text-center">
            {profileError && (
              <div className="mb-4 rounded-lg border border-red-500 bg-red-900/20 p-4">
                <p className="text-sm text-red-400">
                  Failed to load profile: {profileError instanceof Error ? profileError.message : 'Unknown error'}
                </p>
              </div>
            )}
            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'User avatar'}
                className="mx-auto h-16 w-16 rounded-full"
              />
            )}
            <div>
              {profile?.display_name && (
                <p className="text-lg font-medium text-white">{profile.display_name}</p>
              )}
              <p className="text-sm text-gray-400">{user.email}</p>
              {profile && (
                <p className="mt-1 text-xs text-gray-500">Theme: {profile.theme}</p>
              )}
            </div>
            <div className="space-x-4">
              <a
                href="/staging"
                className="inline-block rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700"
              >
                Go to Boards
              </a>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition-colors hover:bg-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <SignInButton />
        )}
      </section>
    </Layout>
  );
}
