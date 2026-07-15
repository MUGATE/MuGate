export type ThemeColors = {
  background: string;
  surface: string;
  surfaceLight: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  onPrimary: string;
  error: string;
  success: string;
  warning: string;
  card: string;
  /** Hero / header gradient [start, end]. */
  gradient: [string, string];
  /** Overlay used behind modals/drawers. */
  overlay: string;
};

export const darkColors: ThemeColors = {
  background: '#0a0e17',
  surface: '#121a2b',
  surfaceLight: '#1a2438',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f4f8',
  textMuted: '#94a3b8',
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  accent: '#60a5fa',
  onPrimary: '#ffffff',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  card: '#141d30',
  gradient: ['#1e3a8a', '#3b82f6'],
  overlay: 'rgba(0,0,0,0.6)',
};

export const lightColors: ThemeColors = {
  background: '#f4f6fb',
  surface: '#ffffff',
  surfaceLight: '#eef2f8',
  border: 'rgba(15,23,42,0.10)',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  accent: '#3b82f6',
  onPrimary: '#ffffff',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  card: '#ffffff',
  gradient: ['#2563eb', '#60a5fa'],
  overlay: 'rgba(15,23,42,0.45)',
};

/** Default export kept for any not-yet-migrated module (dark by default). */
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

/** Theme-aware elevation/shadow presets. */
export function shadow(scheme: 'light' | 'dark') {
  if (scheme === 'light') {
    return {
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    } as const;
  }
  return {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  } as const;
}
