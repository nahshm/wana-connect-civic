/**
 * Single source of truth for the mobile palette.
 * Values mirror the dark theme of the WanaIQ web app (#0E1113 base,
 * elevated surfaces, civic blue primary, civic red brand accent).
 * Change a value here and it updates both Tailwind classes and inline styles.
 */
export const colors = {
  background: '#0E1113',
  surface: '#14181A',
  surfaceElevated: '#191E21',
  border: '#232A2E',
  foreground: '#F7F9FA',
  muted: '#1B2124',
  mutedForeground: '#8C9AA3',

  primary: '#3B82F6',
  primaryForeground: '#F8FAFC',

  civicRed: '#C1351D',
  civicGreen: '#18543A',
  civicBlue: '#2E6FD6',
  civicOrange: '#FA8210',

  destructive: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
} as const;

export const fonts = {
  sans: 'System',
} as const;

export type AppColors = typeof colors;
