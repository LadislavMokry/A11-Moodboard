import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AuthCallback] Setting up auth state listener');

    // Listen for auth state changes instead of immediately calling getSession
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthCallback] Auth event:', event, session);

      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthCallback] Sign in successful, redirecting to home');
        navigate('/', { replace: true });
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('[AuthCallback] Sign in failed');
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <div>
            <p className="text-red-400 mb-4">{error}</p>
            <p className="text-sm text-gray-400">Redirecting...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent mx-auto" />
            <p className="text-sm text-gray-400">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
