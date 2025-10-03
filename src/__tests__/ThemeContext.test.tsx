import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { ReactNode } from 'react';

// Mock useProfile and useUpdateProfile hooks
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/hooks/useUpdateProfile', () => ({
  useUpdateProfile: vi.fn(() => ({ mutate: vi.fn() })),
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

const { useAuth } = await import('@/hooks/useAuth');
const { useProfile } = await import('@/hooks/useProfile');
const { useUpdateProfile } = await import('@/hooks/useUpdateProfile');

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];

  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(listener);
      }
    }),
    removeEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    // Helper to simulate system theme change
    _triggerChange: (newMatches: boolean) => {
      listeners.forEach((listener) => {
        listener({
          matches: newMatches,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent);
      });
    },
    _getListeners: () => listeners,
  };
};

describe('ThemeContext', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  beforeEach(() => {
    // Reset localStorage
    localStorageMock.clear();

    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');

    // Setup matchMedia mock (default to dark)
    matchMediaMock = createMatchMediaMock(true);
    window.matchMedia = vi.fn(() => matchMediaMock as any);

    // Clear query client cache
    queryClient.clear();

    // Reset hook mocks to default states
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);
    vi.mocked(useProfile).mockReturnValue({ data: null, isLoading: false } as any);
    vi.mocked(useUpdateProfile).mockReturnValue({ mutate: vi.fn() } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

  describe('useTheme hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleError.mockRestore();
    });

    it('provides theme context when used within ThemeProvider', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('effectiveTheme');
      expect(result.current).toHaveProperty('setTheme');
    });
  });

  describe('Theme initialization', () => {
    it('defaults to system theme when no preference is stored', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('system');
      expect(result.current.effectiveTheme).toBe('dark'); // matchMedia returns dark
    });

    it('initializes from localStorage for guest users', () => {
      localStorageMock.setItem('theme', 'light');

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('light');
      expect(result.current.effectiveTheme).toBe('light');
    });

    it('initializes from profile for authenticated users', async () => {
      vi.mocked(useProfile).mockReturnValue({
        data: { theme: 'dark' } as any,
        isLoading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      expect(localStorageMock.getItem('theme')).toBe('dark');
    });

    it('resolves system theme based on prefers-color-scheme', () => {
      matchMediaMock = createMatchMediaMock(false); // Light mode
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('system');
      expect(result.current.effectiveTheme).toBe('light');
    });
  });

  describe('Theme changes', () => {
    it('updates theme when setTheme is called', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.effectiveTheme).toBe('light');
    });

    it('persists theme to localStorage for guest users', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock.getItem('theme')).toBe('dark');
    });

    it('calls updateProfile mutation for authenticated users', async () => {
      const mutateMock = vi.fn();
      vi.mocked(useUpdateProfile).mockReturnValue({
        mutate: mutateMock,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(mutateMock).toHaveBeenCalledWith({ theme: 'light' });
    });
  });

  describe('DOM updates', () => {
    it('applies light class to document when theme is light', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('applies dark class to document when theme is dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('applies system preference class when theme is system', () => {
      matchMediaMock = createMatchMediaMock(true); // Dark mode
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('System theme listening', () => {
    it('listens for system theme changes when theme is system', () => {
      matchMediaMock = createMatchMediaMock(false); // Start with light
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Initially light
      expect(result.current.effectiveTheme).toBe('light');

      // Simulate system theme change to dark
      matchMediaMock.matches = true;
      act(() => {
        matchMediaMock._triggerChange(true);
      });

      expect(result.current.effectiveTheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('does not listen for system changes when theme is not system', () => {
      matchMediaMock = createMatchMediaMock(false);
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.effectiveTheme).toBe('dark');

      // Simulate system change - should not affect effectiveTheme
      act(() => {
        matchMediaMock._triggerChange(false);
      });

      expect(result.current.effectiveTheme).toBe('dark');
    });

    it('cleans up event listener on unmount', () => {
      const { unmount } = renderHook(() => useTheme(), { wrapper });

      expect(matchMediaMock._getListeners().length).toBeGreaterThan(0);

      unmount();

      expect(matchMediaMock.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Profile synchronization', () => {
    it('syncs theme when profile loads after initial render', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
      } as any);

      const profileMock = vi.mocked(useProfile);

      // Start with no profile
      profileMock.mockReturnValue({
        data: null,
        isLoading: true,
      } as any);

      const { result, rerender } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('system');

      // Profile loads with light theme
      profileMock.mockReturnValue({
        data: { theme: 'light' } as any,
        isLoading: false,
      } as any);

      rerender();

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      expect(localStorageMock.getItem('theme')).toBe('light');
    });
  });
});
