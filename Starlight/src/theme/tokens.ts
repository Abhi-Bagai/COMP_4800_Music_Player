export type ThemeMode = "light" | "dark";

export type ThemeColorRole =
  | "background"
  | "surface"
  | "surfaceElevated"
  | "primary"
  | "primaryMuted"
  | "primaryAlternate"
  | "primaryMutedBg"
  | "onPrimary"
  | "secondary"
  | "onSecondary"
  | "text"
  | "subtleText"
  | "iconMuted"
  | "border"
  | "accent"
  | "danger"
  | "success"
  | "overlay"
  | "logo"
  | "sidebar"
  | "shadow";

export type ThemeSpacingToken =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl";

export type ThemeRadiusToken = "none" | "sm" | "md" | "lg" | "pill";

export type ThemeFontSizeToken = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export interface ThemeTokens {
  colors: Record<ThemeColorRole, string>;
  spacing: Record<ThemeSpacingToken, number>;
  radius: Record<ThemeRadiusToken, number>;
  fontSize: Record<ThemeFontSizeToken, number>;
  typography: {
    weightRegular: string;
    weightMedium: string;
    weightBold: string;
    family: string;
    monoFamily: string;
  };
  opacity: {
    dragging: number;
    disabled: number;
    overlay: number;
    primaryMuted: number;
  };
  shadow: {
    color: string;
    offset: { width: number; height: number };
    opacity: number;
    radius: number;
    elevation: number;
  };
}

const baseSpacing: ThemeTokens["spacing"] = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const baseRadius: ThemeTokens["radius"] = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
};

const baseFontSize: ThemeTokens["fontSize"] = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const typography = {
  weightRegular: "400",
  weightMedium: "500",
  weightBold: "600",
  family: "System",
  monoFamily: "Menlo",
};

const lightColors: ThemeTokens["colors"] = {
  background: "#F5F6FA", // Off-white/very light gray background
  surface: "#FFFFFF", // Pure white for surfaces
  surfaceElevated: "#F8FAFC", // Very light gray for elevated surfaces
  primary: "#C678FF", // Same vibrant purple for consistency
  primaryMuted: "#A855F7", // Muted purple for secondary states
  primaryAlternate: "#7B61FF", // Alternate primary for sliders
  primaryMutedBg: "rgba(123, 97, 255, 0.15)", // Primary with opacity for backgrounds
  onPrimary: "#FFFFFF", // White text on primary
  secondary: "#E2E8F0", // Light gray for secondary elements
  onSecondary: "#0F1014", // Dark text on light secondary
  text: "#0F1014", // Very dark gray for primary text
  subtleText: "#64748B", // Medium gray for subtle text
  iconMuted: "#A3A5B3", // Muted gray for icons/controls
  border: "#E2E8F0", // Light gray borders
  accent: "#C678FF", // Vibrant purple accent
  danger: "#EF4444", // Red for destructive actions
  success: "#1ED760", // Vibrant green for success states
  overlay: "rgba(0, 0, 0, 0.4)", // Semi-transparent black for overlays
  logo: "#C8B8FF", // Logo purple color
  sidebar: "#F5F6FA", // Sidebar background (same as background in light mode)
  shadow: "#000000", // Black for shadows
};

const darkColors: ThemeTokens["colors"] = {
  background: "#0F1014", // Main dark background - very dark gray/almost black
  surface: "#181A20", // Sidebar/surface color - dark gray
  surfaceElevated: "#26282F", // Elevated surfaces/hover states - darker gray
  primary: "#C678FF", // Vibrant purple for primary accent
  primaryMuted: "#A855F7", // Muted purple for secondary states
  primaryAlternate: "#7B61FF", // Alternate primary for sliders
  primaryMutedBg: "rgba(123, 97, 255, 0.15)", // Primary with opacity for backgrounds
  onPrimary: "#FFFFFF", // White text on primary
  secondary: "#343845", // Medium dark gray with blue tint for borders/dividers
  onSecondary: "#FFFFFF", // White text on secondary
  text: "#FFFFFF", // Pure white for primary text
  subtleText: "#C8CAD4", // Light gray for subtle text
  iconMuted: "#A3A5B3", // Muted gray for icons/controls
  border: "#343845", // Medium dark gray with blue tint for borders
  accent: "#C678FF", // Vibrant purple accent
  danger: "#F87171", // Red for destructive actions
  success: "#1ED760", // Vibrant green for success states
  overlay: "rgba(0, 0, 0, 0.4)", // Semi-transparent black for overlays
  logo: "#C8B8FF", // Logo purple color (original color)
  sidebar: "#14151B", // Sidebar background - slightly different from surface
  shadow: "#000000", // Black for shadows
};

export const themeTokens: Record<ThemeMode, ThemeTokens> = {
  light: {
    colors: lightColors,
    spacing: baseSpacing,
    radius: baseRadius,
    fontSize: baseFontSize,
    typography,
    opacity: {
      dragging: 0.5,
      disabled: 0.5,
      overlay: 0.4,
      primaryMuted: 0.15,
    },
    shadow: {
      color: "#000000",
      offset: { width: 0, height: 4 },
      opacity: 0.25,
      radius: 8,
      elevation: 8,
    },
  },
  dark: {
    colors: darkColors,
    spacing: baseSpacing,
    radius: baseRadius,
    fontSize: baseFontSize,
    typography,
    opacity: {
      dragging: 0.5,
      disabled: 0.5,
      overlay: 0.4,
      primaryMuted: 0.15,
    },
    shadow: {
      color: "#000000",
      offset: { width: 0, height: 4 },
      opacity: 0.25,
      radius: 8,
      elevation: 8,
    },
  },
};

export const getTokens = (mode: ThemeMode) => themeTokens[mode];
