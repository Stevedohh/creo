import { ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd';
import { creoTheme } from './theme';

export interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: ThemeConfig;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  return <ConfigProvider theme={theme ?? creoTheme}>{children}</ConfigProvider>;
}
