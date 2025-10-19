import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
 
export const THEME = {
  light: {
    background: '#F5F6FA', // Off-white/very light gray background
    foreground: '#0F1014', // Very dark gray for primary text
    card: '#FFFFFF', // Pure white for surfaces
    cardForeground: '#0F1014', // Dark text on light cards
    popover: '#FFFFFF', // Same as card
    popoverForeground: '#0F1014', // Dark text on popovers
    primary: '#C678FF', // Vibrant purple for primary accent
    primaryForeground: '#FFFFFF', // White text on primary
    secondary: '#E2E8F0', // Light gray for secondary elements
    secondaryForeground: '#0F1014', // Dark text on light secondary
    muted: '#F8FAFC', // Very light gray for muted elements
    mutedForeground: '#64748B', // Medium gray for muted text
    accent: '#C678FF', // Vibrant purple accent
    accentForeground: '#FFFFFF', // White text on accent
    destructive: '#EF4444', // Red for destructive actions
    border: '#E2E8F0', // Light gray borders
    input: '#E2E8F0', // Light gray for inputs
    ring: '#C678FF', // Vibrant purple for focus rings
    radius: '0.625rem',
    chart1: '#C678FF', // Vibrant purple
    chart2: '#A855F7', // Muted purple
    chart3: '#9333EA', // Darker purple
    chart4: '#7C3AED', // Even darker purple
    chart5: '#6D28D9', // Darkest purple
  },
  dark: {
    background: '#0F1014', // Main dark background - very dark gray/almost black
    foreground: '#FFFFFF', // Pure white text
    card: '#181A20', // Sidebar/surface color - dark gray
    cardForeground: '#FFFFFF', // White text on cards
    popover: '#181A20', // Same as card
    popoverForeground: '#FFFFFF', // White text on popovers
    primary: '#C678FF', // Vibrant purple for primary accent
    primaryForeground: '#FFFFFF', // White text on primary
    secondary: '#343845', // Medium dark gray with blue tint
    secondaryForeground: '#FFFFFF', // White text on secondary
    muted: '#26282F', // Elevated surfaces/hover states
    mutedForeground: '#C8CAD4', // Light gray for muted text
    accent: '#C678FF', // Vibrant purple accent
    accentForeground: '#FFFFFF', // White text on accent
    destructive: '#F87171', // Red for destructive actions
    border: '#343845', // Medium dark gray with blue tint for borders
    input: '#343845', // Same as border for inputs
    ring: '#C678FF', // Vibrant purple for focus rings
    radius: '0.625rem',
    chart1: '#C678FF', // Vibrant purple
    chart2: '#A855F7', // Muted purple
    chart3: '#9333EA', // Darker purple
    chart4: '#7C3AED', // Even darker purple
    chart5: '#6D28D9', // Darkest purple
  },
};
 
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};