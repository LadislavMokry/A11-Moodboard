import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ThemeToggle, themeOptions } from '@/components/ThemeToggle';
import { SignInButton } from '@/components/SignInButton';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Monitor, Moon, Sun, Menu, Plus, User, LogOut, LogIn } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

type ThemeIcon = typeof Monitor;

const iconMap: Record<Theme, ThemeIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const CreateBoardModalLazy = lazy(async () => ({ default: (await import('@/components/CreateBoardModal')).CreateBoardModal }));

export function Header() {
  const { user, loading, signOut, signInWithGoogle } = useAuth();
  const { data: profile } = useProfile();
  const { theme, effectiveTheme, setTheme } = useTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const newBoardClasses = effectiveTheme === 'dark'
    ? 'bg-neutral-900 text-neutral-100 hover:bg-neutral-800'
    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition-opacity"
          aria-label="Moodeight - Home"
        >
          moodeight
        </Link>

        {/* Right side navigation */}
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Main navigation">
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
            ) : user ? (
              <>
                <Button
                  size="sm"
                  className={cn('hidden sm:inline-flex', newBoardClasses)}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Board
                </Button>

                <ThemeToggle />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
                      aria-label="User menu"
                    >
                      <Avatar
                        src={profile?.avatar_url}
                        alt={profile?.display_name || user.email || 'User avatar'}
                        fallbackText={profile?.display_name || user.email || '?'}
                        size="md"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar
                        src={profile?.avatar_url}
                        alt={profile?.display_name || user.email || 'User avatar'}
                        fallbackText={profile?.display_name || user.email || '?'}
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {profile?.display_name || 'User'}
                        </p>
                        <p className="max-w-[180px] truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <ThemeToggle />
                <SignInButton />
              </>
            )}
          </nav>

          <nav className="sm:hidden" aria-label="Mobile navigation">
            {loading ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <MobileMenu
                userEmail={user?.email ?? null}
                displayName={profile?.display_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
                theme={theme}
                onThemeChange={setTheme}
                onSignOut={handleSignOut}
                onSignIn={handleSignIn}
                isAuthenticated={!!user}
                onNewBoard={() => setIsCreateModalOpen(true)}
              />
            )}
          </nav>
        </div>
      </div>

      <Suspense
        fallback={(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" data-testid="create-board-modal-fallback">
            <Skeleton className="h-40 w-80" />
          </div>
        )}
      >
        {isCreateModalOpen ? (
          <CreateBoardModalLazy open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        ) : null}
      </Suspense>
    </header>
  );
}

interface MobileMenuProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onSignOut: () => Promise<void> | void;
  onSignIn: () => Promise<void> | void;
  onNewBoard: () => void;
}

function MobileMenu({
  isAuthenticated,
  userEmail,
  displayName,
  avatarUrl,
  theme,
  onThemeChange,
  onSignOut,
  onSignIn,
  onNewBoard,
}: MobileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-950"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar
                src={avatarUrl}
                alt={displayName || userEmail || 'User avatar'}
                fallbackText={displayName || userEmail || '?'}
                size="sm"
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {displayName || 'User'}
                </span>
                {userEmail && (
                  <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {userEmail}
                  </span>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onNewBoard();
              }}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create board
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => onThemeChange(value as Theme)}
            >
              {themeOptions.map(({ value, label }) => {
                const Icon = iconMap[value];
                return (
                  <DropdownMenuRadioItem key={value} value={value} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void onSignOut();
              }}
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => onThemeChange(value as Theme)}
            >
              {themeOptions.map(({ value, label }) => {
                const Icon = iconMap[value];
                return (
                  <DropdownMenuRadioItem key={value} value={value} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void onSignIn();
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
