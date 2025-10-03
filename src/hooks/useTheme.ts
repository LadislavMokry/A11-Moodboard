import { useContext } from 'react';
import { ThemeContext, type Theme, type EffectiveTheme } from '@/contexts/ThemeContext';

export type { Theme, EffectiveTheme };

/**
 * Hook to access and modify the current theme
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
