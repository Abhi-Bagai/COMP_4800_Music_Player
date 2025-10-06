import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/src/theme/provider';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'mono';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: 'default' | 'subtle' | 'accent' | 'danger' | 'success';
  weight?: 'regular' | 'medium' | 'bold';
}

export function Text({
  variant = 'body',
  tone = 'default',
  weight = 'regular',
  style,
  ...rest
}: TextProps) {
  const { tokens } = useTheme();
  const fontSizes = tokens.fontSize;

  const size = {
    title: fontSizes.xl,
    subtitle: fontSizes.lg,
    body: fontSizes.md,
    caption: fontSizes.sm,
    mono: fontSizes.sm,
  }[variant];

  const color = {
    default: tokens.colors.text,
    subtle: tokens.colors.subtleText,
    accent: tokens.colors.accent,
    danger: tokens.colors.danger,
    success: tokens.colors.success,
  }[tone];

  const fontFamily = variant === 'mono' ? tokens.typography.monoFamily : tokens.typography.family;
  const fontWeight = {
    regular: tokens.typography.weightRegular,
    medium: tokens.typography.weightMedium,
    bold: tokens.typography.weightBold,
  }[weight];

  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: size,
          color,
          fontFamily,
          fontWeight,
        },
        style,
      ]}
    />
  );
}
