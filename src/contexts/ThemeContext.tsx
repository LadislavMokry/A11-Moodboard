import { createContext, useEffect, useState, type ReactNode } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useAuth } from '@/hooks/useAuth';

export type Theme = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme';

/**
 * Resolves system theme preference using media query
 */
function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolves a theme preference to an effective theme
 */
function resolveEffectiveTheme(theme: Theme): EffectiveTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  // Initialize theme from localStorage first (works for both guest and auth)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'system' || stored === 'light' || stored === 'dark' ? stored : 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    resolveEffectiveTheme(theme)
  );

  // Sync theme from profile when available for authenticated users
  useEffect(() => {
    if (!user || !profile?.theme) {
      return;
    }

    setThemeState((current) => {
      if (current === profile.theme) {
        return current;
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, profile.theme);
      }
      return profile.theme;
    });
  }, [user, profile?.theme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      setEffectiveTheme(getSystemTheme());
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme to DOM whenever effectiveTheme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  // Update effectiveTheme when theme changes
  useEffect(() => {
    setEffectiveTheme(resolveEffectiveTheme(theme));
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Always persist to localStorage for immediate consistency
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    }

    // Also update profile for authenticated users
    if (user) {
      updateProfile.mutate({ theme: newTheme });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
