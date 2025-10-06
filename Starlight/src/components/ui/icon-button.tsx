import { cloneElement, isValidElement } from 'react';
import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { useTheme } from '@/src/theme/provider';

export interface IconButtonProps extends PressableProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'primary' | 'danger';
  icon: React.ReactNode;
}

export function IconButton({ size = 'md', tone = 'default', icon, style, ...rest }: IconButtonProps) {
  const { tokens } = useTheme();

  const dimension = {
    sm: 32,
    md: 40,
    lg: 48,
  }[size];

  const background = {
    default: tokens.colors.surfaceElevated,
    primary: tokens.colors.primary,
    danger: tokens.colors.danger,
  }[tone];

  const pressedBg = tone === 'default' ? tokens.colors.surface : tokens.colors.primaryMuted;

  const contentColor = tone === 'primary' ? tokens.colors.onPrimary : tokens.colors.text;

  const renderedIcon = isValidElement(icon) ? cloneElement(icon, { color: contentColor }) : icon;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: tokens.radius.lg,
          backgroundColor: pressed ? pressedBg : background,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.iconContainer}>{renderedIcon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
