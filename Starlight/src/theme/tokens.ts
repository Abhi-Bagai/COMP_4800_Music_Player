export type ThemeMode = "light" | "dark";

export type ThemeColorRole =
  | "background"
  | "surface"
  | "surfaceElevated"
  | "primary"
  | "primaryMuted"
  | "onPrimary"
  | "secondary"
  | "onSecondary"
  | "text"
  | "subtleText"
  | "border"
  | "accent"
  | "danger"
  | "success";

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
  background: "#F7F9FB",
  surface: "#FFFFFF",
  surfaceElevated: "#EDF1F7",
  primary: "#2563EB",
  primaryMuted: "#AEC8FF",
  onPrimary: "#FFFFFF",
  secondary: "#6366F1",
  onSecondary: "#FFFFFF",
  text: "#0F172A",
  subtleText: "#475569",
  border: "#CBD5F5",
  accent: "#14B8A6",
  danger: "#EF4444",
  success: "#22C55E",
};

const darkColors: ThemeTokens["colors"] = {
  background: "#1A1A1A", // Main dark background
  surface: "#2A2A2A", // Slightly lighter for cards/surfaces
  surfaceElevated: "#3A3A3A", // Even lighter for elevated surfaces
  primary: "#8B5CF6", // Purple accent color
  primaryMuted: "#4C1D95", // Darker purple
  onPrimary: "#FFFFFF", // White text on primary
  secondary: "#818CF8",
  onSecondary: "#0B1120",
  text: "#FFFFFF", // White text
  subtleText: "#A1A1AA", // Light gray for subtle text
  border: "#404040", // Dark gray borders
  accent: "#8B5CF6", // Purple accent
  danger: "#F87171",
  success: "#4ADE80",
};

export const themeTokens: Record<ThemeMode, ThemeTokens> = {
  light: {
    colors: lightColors,
    spacing: baseSpacing,
    radius: baseRadius,
    fontSize: baseFontSize,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing: baseSpacing,
    radius: baseRadius,
    fontSize: baseFontSize,
    typography,
  },
};

export const getTokens = (mode: ThemeMode) => themeTokens[mode];
