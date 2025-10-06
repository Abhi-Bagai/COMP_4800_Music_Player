import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { getTokens, ThemeMode, ThemeTokens } from './tokens';

type ThemeContextValue = {
  mode: ThemeMode;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = PropsWithChildren<{ initialMode?: ThemeMode }>;

export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const nativeColorScheme = useColorScheme();
  const mode = initialMode ?? (nativeColorScheme ?? 'light');

  const ctx = useMemo<ThemeContextValue>(() => ({
    mode,
    tokens: getTokens(mode),
  }), [mode]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return value;
}
