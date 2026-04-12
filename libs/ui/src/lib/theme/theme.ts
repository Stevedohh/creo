import { theme as antTheme } from 'antd';
import type { ThemeConfig } from 'antd';

/*
 * Creo Color System
 *
 * PRIMARY GREEN:      #2fbc5b (main) · #32c364 (hover) · #0f2418 (bg) · #1a3324 (bg hover) · #2a4d3a (border) · #3a664d (border hover)
 * ERROR RED:          #f22a36 (main) · #f53a46 (hover) · #2d0f12 (bg) · #45161b (bg hover) · #6b2129 (border) · #8f2c36 (border hover)
 * WARNING ORANGE:     #ff7f16 (main) · #ff8f33 (hover) · #2a1f0f (bg) · #3d2d16 (bg hover) · #5c4521 (border) · #7a5c2d (border hover)
 * INFO BLUE:          #319cfc (main) · #4aa3ff (hover) · #0a1a2a (bg) · #102a45 (bg hover) · #1e3d66 (border) · #2d5290 (border hover)
 *
 * SEMANTIC:           Success = Primary Green · Danger = Error Red · Warning = Warning Orange · Info = Info Blue
 */

const sharedTokens = {
  colorPrimary: '#2fbc5b',
  colorLink: '#2fbc5b',
  colorLinkHover: '#32c364',
  colorSuccess: '#2fbc5b',
  colorWarning: '#ff7f16',
  colorError: '#f22a36',
  colorInfo: '#319cfc',

  borderRadius: 20,
  borderRadiusSM: 16,
  borderRadiusLG: 24,

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
    colorTextBase: '#e9f0f5',
    colorBgBase: '#02080e',
    colorBgContainer: '#09131a',
    colorBgElevated: '#09131a',
    colorBgLayout: '#02080e',
    colorBgSpotlight: 'rgba(233, 240, 245, 0.85)',
    colorBgMask: 'rgba(2, 8, 14, 0.65)',
    colorText: 'rgba(233, 240, 245, 0.88)',
    colorTextSecondary: 'rgba(233, 240, 245, 0.65)',
    colorTextTertiary: 'rgba(233, 240, 245, 0.45)',
    colorTextQuaternary: 'rgba(233, 240, 245, 0.25)',
    colorBorder: '#202a32',
    colorBorderSecondary: '#172128',

    colorPrimaryBg: '#0f2418',
    colorPrimaryBgHover: '#1a3324',
    colorPrimaryBorder: '#2a4d3a',
    colorPrimaryBorderHover: '#3a664d',
    colorPrimaryHover: '#32c364',
    colorPrimaryActive: '#2fbc5b',
    colorPrimaryText: '#2fbc5b',
    colorPrimaryTextHover: '#32c364',
    colorPrimaryTextActive: '#2fbc5b',

    colorSuccessBg: '#0f2418',
    colorSuccessBgHover: '#1a3324',
    colorSuccessBorder: '#2a4d3a',
    colorSuccessBorderHover: '#3a664d',
    colorSuccessHover: '#32c364',
    colorSuccessActive: '#2fbc5b',
    colorSuccessText: '#2fbc5b',
    colorSuccessTextHover: '#32c364',
    colorSuccessTextActive: '#2fbc5b',

    colorWarningBg: '#2a1f0f',
    colorWarningBgHover: '#3d2d16',
    colorWarningBorder: '#5c4521',
    colorWarningBorderHover: '#7a5c2d',
    colorWarningHover: '#ff8f33',
    colorWarningActive: '#ff7f16',
    colorWarningText: '#ff7f16',
    colorWarningTextHover: '#ff8f33',
    colorWarningTextActive: '#ff7f16',

    colorErrorBg: '#2d0f12',
    colorErrorBgHover: '#45161b',
    colorErrorBorder: '#6b2129',
    colorErrorBorderHover: '#8f2c36',
    colorErrorHover: '#f53a46',
    colorErrorActive: '#f22a36',
    colorErrorText: '#f22a36',
    colorErrorTextHover: '#f53a46',
    colorErrorTextActive: '#f22a36',

    colorInfoBg: '#0a1a2a',
    colorInfoBgHover: '#102a45',
    colorInfoBorder: '#1e3d66',
    colorInfoBorderHover: '#2d5290',
    colorInfoHover: '#4aa3ff',
    colorInfoActive: '#319cfc',
    colorInfoText: '#319cfc',
    colorInfoTextHover: '#4aa3ff',
    colorInfoTextActive: '#319cfc',

    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05)',
    boxShadowSecondary: '0 4px 12px 0 rgba(0, 0, 0, 0.3)',
  },
  components: {
    Layout: { siderBg: '#060f15', headerBg: '#060f15', bodyBg: '#02080e' },
    Button: {
      primaryColor: '#ffffff',
      defaultBg: '#09131a',
      defaultBorderColor: '#202a32',
      defaultColor: '#e9f0f5',
      borderRadius: 20,
      borderColorDisabled: 'transparent',
    },
    Breadcrumb: {
      itemColor: 'rgba(233, 240, 245, 0.65)',
      lastItemColor: 'rgba(233, 240, 245, 0.88)',
      linkColor: 'rgba(233, 240, 245, 0.65)',
      linkHoverColor: '#2fbc5b',
      separatorColor: 'rgba(233, 240, 245, 0.25)',
    },
    Input: {
      activeBorderColor: '#2fbc5b',
      hoverBorderColor: '#32c364',
      colorBgContainer: '#060f15',
    },
    Form: { labelColor: 'rgba(233, 240, 245, 0.65)' },
    Card: { colorBgContainer: '#09131a', borderRadiusLG: 16 },
    Tooltip: { colorBgSpotlight: '#1a2530', colorTextLightSolid: '#e9f0f5' },
    Popover: { colorBgElevated: '#0f1920' },
    Dropdown: { colorBgElevated: '#0f1920' },
    Select: { optionSelectedBg: '#0f2418' },
    Modal: { contentBg: '#0f1920', headerBg: '#0f1920' },
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
      borderColorDisabled: 'transparent',
    },
    Input: {
      activeBorderColor: '#2fbc5b',
      hoverBorderColor: '#2fbc5b',
    },
    Form: { labelColor: '#3A3A3A' },
    Card: { colorBgContainer: '#FFFFFF', borderRadiusLG: 16 },
  },
};

/** @deprecated Use creoDarkTheme instead */
export const creoTheme = creoDarkTheme;

export type CreoThemeMode = 'dark' | 'light';
