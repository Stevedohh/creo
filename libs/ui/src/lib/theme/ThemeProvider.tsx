import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { creoDarkTheme, creoLightTheme } from './theme';
import type { CreoThemeMode } from './theme';

interface ThemeContextValue {
  mode: CreoThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: CreoThemeMode;
}

const STORAGE_KEY = 'creo-theme';

function getInitialMode(defaultMode: CreoThemeMode): CreoThemeMode {
  if (typeof window === 'undefined') return defaultMode;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return defaultMode;
}

export function ThemeProvider({ children, defaultMode = 'dark' }: ThemeProviderProps) {
  const [mode, setMode] = useState<CreoThemeMode>(() => getInitialMode(defaultMode));

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const theme = mode === 'dark' ? creoDarkTheme : creoLightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}
