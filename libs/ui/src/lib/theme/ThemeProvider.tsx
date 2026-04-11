import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
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

export { AntApp };
export const useApp = AntApp.useApp;

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

// ────────────────────────────────────────────────────────────
// CSS Variable Injector
//
// Reads computed antd design tokens via useToken() and injects
// them as --creo-* CSS custom properties on <html>.
// This is the bridge between theme.ts (single source of truth)
// and SCSS modules (which use --creo-* variables).
// ────────────────────────────────────────────────────────────

const TOKEN_MAP: Record<string, string> = {
  // Colors — Primary
  colorPrimary:        '--creo-color-primary',
  colorPrimaryHover:   '--creo-color-primary-hover',
  colorPrimaryActive:  '--creo-color-primary-active',
  colorPrimaryBg:      '--creo-color-primary-bg',
  colorPrimaryBorder:  '--creo-color-primary-border',
  // Colors — Semantic
  colorSuccess:        '--creo-color-success',
  colorWarning:        '--creo-color-warning',
  colorError:          '--creo-color-error',
  colorErrorBg:        '--creo-color-error-bg',
  colorInfo:           '--creo-color-info',
  colorLink:           '--creo-color-link',
  // Backgrounds
  colorBgLayout:       '--creo-bg-base',
  colorBgContainer:    '--creo-bg-container',
  colorBgElevated:     '--creo-bg-elevated',
  colorFillTertiary:   '--creo-bg-hover',
  colorFillSecondary:  '--creo-bg-active',
  // Text
  colorText:           '--creo-text-primary',
  colorTextSecondary:  '--creo-text-secondary',
  colorTextTertiary:   '--creo-text-tertiary',
  colorTextQuaternary: '--creo-text-disabled',
  // Borders
  colorBorder:          '--creo-border-color',
  colorBorderSecondary: '--creo-border-color-secondary',
};

const RADIUS_MAP: Record<string, string> = {
  borderRadius:   '--creo-radius',
  borderRadiusSM: '--creo-radius-sm',
  borderRadiusLG: '--creo-radius-lg',
};

const SHADOW_MAP: Record<string, string[]> = {
  boxShadow:          ['--creo-shadow-sm', '--creo-shadow'],
  boxShadowSecondary: ['--creo-shadow-md', '--creo-shadow-lg'],
};

function CSSVarInjector({ children }: { children: React.ReactNode }) {
  const { token } = antTheme.useToken();

  useEffect(() => {
    const root = document.documentElement;

    for (const [tokenName, cssVar] of Object.entries(TOKEN_MAP)) {
      const value = (token as unknown as Record<string, unknown>)[tokenName];
      if (value !== undefined) {
        root.style.setProperty(cssVar, String(value));
      }
    }

    for (const [tokenName, cssVar] of Object.entries(RADIUS_MAP)) {
      const value = (token as unknown as Record<string, unknown>)[tokenName];
      if (value !== undefined) {
        root.style.setProperty(cssVar, `${value}px`);
      }
    }

    for (const [tokenName, cssVars] of Object.entries(SHADOW_MAP)) {
      const value = (token as unknown as Record<string, unknown>)[tokenName];
      if (value !== undefined) {
        for (const cssVar of cssVars) {
          root.style.setProperty(cssVar, String(value));
        }
      }
    }

    root.style.setProperty('--creo-card-radius', `${token.borderRadiusLG}px`);
  }, [token]);

  return <>{children}</>;
}

// ────────────────────────────────────────────────────────────

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
      <ConfigProvider theme={theme}>
        <AntApp>
          <CSSVarInjector>{children}</CSSVarInjector>
        </AntApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
