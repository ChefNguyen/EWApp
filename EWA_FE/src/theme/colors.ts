// Design tokens — preserving exact web app color palette
export const colors = {
  // Primary (indigo)
  primary: '#4f46e5',
  primaryLight: '#eef2ff',
  primaryDark: '#3730a3',
  primaryContainer: '#6d5cf7',

  // Purple accent
  purple: '#9333ea',
  purpleLight: '#f5f3ff',

  // Success (emerald)
  success: '#10b981',
  successLight: '#ecfdf5',

  // Warning (amber)
  warning: '#f59e0b',
  warningLight: '#fffbeb',

  // Error (red)
  error: '#ef4444',
  errorLight: '#fef2f2',

  // Surface / Background
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  surfaceHigh: '#e2e8f0',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textDisabled: '#cbd5e1',

  // Border
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Orange / Tag
  orange: '#f97316',
  orangeLight: '#fff7ed',

  // Slate shades
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Indigo shades
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo900: '#312e81',

  // Blue
  blue50: '#eff6ff',
  blue500: '#3b82f6',
  blue600: '#2563eb',

  // Emerald
  emerald50: '#ecfdf5',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',

  // Amber
  amber50: '#fffbeb',
  amber500: '#f59e0b',
  amber600: '#d97706',

  // Red
  red50: '#fef2f2',
  red500: '#ef4444',
  red600: '#dc2626',

  // Cyan
  cyan50: '#ecfeff',
  cyan600: '#0891b2',

  // Purple
  purple50: '#faf5ff',

  // Teal
  teal50: '#f0fdfa',
  teal600: '#0d9488',

  // White & Black
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};
