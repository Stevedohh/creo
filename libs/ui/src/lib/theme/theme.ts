import { theme as antTheme } from 'antd';
import type { ThemeConfig } from 'antd';

/*
 * Creo Color System
 *
 * GRAYSCALE:          White #FFFFFF · Ghost #F2F2F0 · London Grey #BABAB4 · Wolf Grey #6B6B6B · Metropolis #3A3A3A · Void #1A1A1A
 * SPINTEL GREEN:      Mist #E6F9F0 · Foam #AEEBD2 · Spintel #33C17B · Forest #1E9660 · Deep #0F6640 · Abyss #07382A
 * FEVER RED:          Blush #FDEAEA · Rose #F9B8B8 · Fever #F25252 · Ember #C93333 · Crimson #8E1E1E · Soot #4A0E0E
 * ORBIT BLUE:         Ice #E8F2FF · Sky #B3D4FA · Orbit #3D8FF5 · Cobalt #1E65C8 · Navy #0D3D82 · Ink #06204A
 * SOLAR AMBER:        Cream #FEF8E6 · Glow #FAD98A · Solar #F5A623 · Ochre #C2760A · Rust #7F4C05 · Bark #3D2202
 *
 * SEMANTIC:           Success = Spintel · Danger = Fever · Warning = Solar · Info = Orbit
 */

const sharedTokens = {
  colorPrimary: '#8BC34A',
  colorLink: '#8BC34A',
  colorLinkHover: '#9CCC65',
  colorSuccess: '#8BC34A',
  colorWarning: '#F5A623',
  colorError: '#F25252',
  colorInfo: '#3D8FF5',

  borderRadius: 20,
  borderRadiusLG: 24,
  borderRadiusSM: 16,

  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: 14,

  controlHeight: 38,
  controlHeightLG: 46,
  controlHeightSM: 30,
};

export const creoDarkTheme: ThemeConfig = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    ...sharedTokens,
    colorBgBase: '#0a0a0a',
    colorBgContainer: '#151515',
    colorBgElevated: '#1c1c1c',
    colorBgLayout: '#0a0a0a',
    colorText: '#FFFFFF',
    colorTextSecondary: '#BABAB4',
    colorTextTertiary: '#6B6B6B',
    colorTextQuaternary: '#3A3A3A',
    colorBorder: '#2a2a2a',
    colorBorderSecondary: '#1e1e1e',
  },
  components: {
    Layout: { siderBg: '#111111', headerBg: '#111111', bodyBg: '#0a0a0a' },
    Button: {
      primaryColor: '#1a1a1a',
      defaultBg: '#151515',
      defaultBorderColor: '#2a2a2a',
      defaultColor: '#FFFFFF',
      borderRadius: 20,
    },
    Input: {
      activeBorderColor: '#8BC34A',
      hoverBorderColor: '#8BC34A',
      colorBgContainer: '#111111',
    },
    Form: { labelColor: '#BABAB4' },
    Card: { colorBgContainer: '#151515', borderRadiusLG: 16 },
  },
};

export const creoLightTheme: ThemeConfig = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    ...sharedTokens,
    colorBgBase: '#F2F2F0',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#F2F2F0',
    colorText: '#1A1A1A',
    colorTextSecondary: '#3A3A3A',
    colorTextTertiary: '#6B6B6B',
    colorTextQuaternary: '#BABAB4',
    colorBorder: '#ddddd8',
    colorBorderSecondary: '#e8e8e4',
  },
  components: {
    Layout: { siderBg: '#FFFFFF', headerBg: '#FFFFFF', bodyBg: '#F2F2F0' },
    Button: {
      primaryColor: '#FFFFFF',
      defaultBg: '#FFFFFF',
      defaultBorderColor: '#ddddd8',
      defaultColor: '#1A1A1A',
      borderRadius: 20,
    },
    Input: {
      activeBorderColor: '#33C17B',
      hoverBorderColor: '#33C17B',
    },
    Form: { labelColor: '#3A3A3A' },
    Card: { colorBgContainer: '#FFFFFF', borderRadiusLG: 16 },
  },
};

/** @deprecated Use creoDarkTheme instead */
export const creoTheme = creoDarkTheme;

export type CreoThemeMode = 'dark' | 'light';
