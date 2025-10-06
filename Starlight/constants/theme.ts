import { Platform } from 'react-native';

import type { ThemeMode } from '@/src/theme/tokens';
import { getTokens } from '@/src/theme/tokens';

const tintColorLight = '#2563EB';
const tintColorDark = '#60A5FA';

export const Colors = {
  light: {
    text: getTokens('light').colors.text,
    background: getTokens('light').colors.background,
    tint: tintColorLight,
    icon: getTokens('light').colors.subtleText,
    tabIconDefault: getTokens('light').colors.subtleText,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: getTokens('dark').colors.text,
    background: getTokens('dark').colors.background,
    tint: tintColorDark,
    icon: getTokens('dark').colors.subtleText,
    tabIconDefault: getTokens('dark').colors.subtleText,
    tabIconSelected: tintColorDark,
  },
};

export const ThemeByMode: Record<ThemeMode, ReturnType<typeof getTokens>> = {
  light: getTokens('light'),
  dark: getTokens('dark'),
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
