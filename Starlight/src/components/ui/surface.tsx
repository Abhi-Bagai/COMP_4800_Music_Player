import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '@/src/theme/provider';

export type SurfaceProps = PropsWithChildren<
  ViewProps & {
    variant?: 'plain' | 'elevated' | 'tinted';
    padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  }
>;

export function Surface({
  style,
  children,
  variant = 'plain',
  padding = 'none',
  ...rest
}: SurfaceProps) {
  const { tokens } = useTheme();

  const background = {
    plain: tokens.colors.surface,
    elevated: tokens.colors.surfaceElevated,
    tinted: tokens.colors.primaryMuted,
  }[variant];

  const content = (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: background,
          padding: tokens.spacing[padding],
          borderRadius: tokens.radius.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
