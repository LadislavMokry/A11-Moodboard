import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Theme, EffectiveTheme } from '@/hooks/useTheme';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

// Simplify SignInButton rendering for focused header tests
vi.mock('@/components/SignInButton', () => ({
  SignInButton: () => (
    <button type="button">Sign in with Google</button>
  ),
}));

// Mock Avatar to avoid image loading complexities
vi.mock('@/components/Avatar', () => ({
  Avatar: ({ fallbackText }: { fallbackText?: string }) => (
    <div data-testid="avatar">{fallbackText ?? '?'}</div>
  ),
}));

const { useAuth } = await import('@/hooks/useAuth');
const { useProfile } = await import('@/hooks/useProfile');
const { useTheme } = await import('@/hooks/useTheme');
const { Header } = await import('@/components/Header');

const createThemeMock = (
  overrides?: Partial<{ theme: Theme; effectiveTheme: EffectiveTheme; setTheme: (value: Theme) => void }>,
) => {
  const setTheme = vi.fn();
  return {
    theme: 'system' as Theme,
    effectiveTheme: 'dark' as EffectiveTheme,
    setTheme,
    ...overrides,
  };
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(useAuth).mockReturnValue({
    user: null,
    session: null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  } as any);

  vi.mocked(useProfile).mockReturnValue({
    data: null,
    isLoading: false,
  } as any);

  vi.mocked(useTheme).mockReturnValue(createThemeMock());
});

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

const openMobileMenu = () => {
  const trigger = screen.getByLabelText('Open navigation menu');
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'Enter' });
  return waitFor(() => {
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    return trigger;
  });
};

describe('Header', () => {
  it('renders theme toggle and sign-in button when unauthenticated (desktop)', () => {
    renderHeader();

    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
  });

  it('renders authenticated controls on desktop', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '123', email: 'test@example.com' } as any,
      session: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useProfile).mockReturnValue({
      data: {
        display_name: 'Test User',
        avatar_url: null,
      },
      isLoading: false,
    } as any);

    renderHeader();

    expect(screen.getByText('New Board')).toBeInTheDocument();
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('allows theme selection from the mobile menu when signed out', async () => {
    const setTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue(createThemeMock({ setTheme }));

    renderHeader();

    await openMobileMenu();

    const menu = await screen.findByRole('menu');
    const darkOption = within(menu).getByText('Dark');
    fireEvent.click(darkOption);

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('shows authenticated actions in the mobile menu', async () => {
    const signOut = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: '123', email: 'test@example.com' } as any,
      session: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut,
    });

    vi.mocked(useProfile).mockReturnValue({
      data: {
        display_name: 'Test User',
        avatar_url: null,
      },
      isLoading: false,
    } as any);

    renderHeader();

    await openMobileMenu();

    const menu = await screen.findByRole('menu');

    expect(within(menu).getByText('New Board')).toBeInTheDocument();
    expect(within(menu).getByText('Profile')).toBeInTheDocument();

    const signOutItem = within(menu).getByText('Sign out');
    fireEvent.click(signOutItem);

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
