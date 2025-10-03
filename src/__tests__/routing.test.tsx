import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/hooks/useUpdateProfile', () => ({
  useUpdateProfile: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => (
    <div data-testid="layout" style={{ minHeight: '100vh' }}>
      {children}
    </div>
  ),
}));

import App from '@/App';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const { useAuth } = await import('@/hooks/useAuth');

const createAuthState = (overrides?: Partial<ReturnType<typeof useAuth>>) => ({
  user: null,
  session: null,
  loading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue(createAuthState());
});

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to home', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthState({ user: null, loading: false }));

    render(
      <MemoryRouter initialEntries={['/boards/123']}>
        <Routes>
          <Route path="/" element={<div>Home Route</div>} />
          <Route
            path="/boards/:boardId"
            element={(
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Route')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthState({ user: { id: 'user-1' } as any }));

    render(
      <MemoryRouter initialEntries={['/boards/123']}>
        <Routes>
          <Route
            path="/boards/:boardId"
            element={(
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

describe('App routing', () => {
  it('renders the home page on root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Moodeight/i)).toBeInTheDocument();
  });

  it('renders staging page for /staging', () => {
    render(
      <MemoryRouter initialEntries={['/staging']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Staging Area/i)).toBeInTheDocument();
  });

  it('renders board page when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthState({ user: { id: 'abc-123' } as any }));

    render(
      <MemoryRouter initialEntries={['/boards/123']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Board #123/i)).toBeInTheDocument();
  });

  it('renders public board page without authentication', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthState({ user: null }));

    render(
      <MemoryRouter initialEntries={['/b/shared-token']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/shared-token/i)).toBeInTheDocument();
  });

  it('renders profile page when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthState({ user: { id: 'user-42' } as any }));

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Profile settings/i)).toBeInTheDocument();
  });

  it('renders not found page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/missing']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });
});

