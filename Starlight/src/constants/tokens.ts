// Shared tokens to resolve theme context issues
// This provides a fallback when useTheme() hook isn't working properly

export const TOKENS = {
  colors: {
    text: '#0F172A',
    subtleText: '#475569',
    background: '#F7F9FB',
    surface: '#FFFFFF',
    surfaceElevated: '#EDF1F7',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    accent: '#14B8A6',
    danger: '#EF4444',
    border: '#CBD5F5',
    secondary: '#6366F1',
    onSecondary: '#FFFFFF',
    success: '#22C55E',
    primaryMuted: '#AEC8FF',
  }
} as const;