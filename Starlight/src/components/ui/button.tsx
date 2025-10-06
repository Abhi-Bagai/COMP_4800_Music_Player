import { PropsWithChildren, useMemo } from 'react';
import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/src/theme/provider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends PropsWithChildren<PressableProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const { tokens } = useTheme();

  const { paddingY, paddingX, textVariant } = useMemo(() => {
    switch (size) {
      case 'sm':
        return { paddingY: tokens.spacing.xs, paddingX: tokens.spacing.sm, textVariant: 'caption' as const };
      case 'lg':
        return { paddingY: tokens.spacing.md, paddingX: tokens.spacing.xl, textVariant: 'subtitle' as const };
      default:
        return { paddingY: tokens.spacing.sm, paddingX: tokens.spacing.lg, textVariant: 'body' as const };
    }
  }, [size, tokens.spacing.lg, tokens.spacing.md, tokens.spacing.sm, tokens.spacing.xl, tokens.spacing.xs]);

  const baseColors = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: tokens.colors.secondary,
          textColor: tokens.colors.onSecondary,
          pressed: tokens.colors.secondary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: tokens.colors.text,
          pressed: tokens.colors.surfaceElevated,
        };
      default:
        return {
          backgroundColor: tokens.colors.primary,
          textColor: tokens.colors.onPrimary,
          pressed: tokens.colors.primaryMuted,
        };
    }
  }, [tokens.colors]);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? baseColors.pressed : baseColors.backgroundColor,
          paddingVertical: paddingY,
          paddingHorizontal: paddingX,
          opacity: disabled ? 0.6 : 1,
          borderRadius: tokens.radius.md,
        },
        variant === 'ghost' && styles.ghostBorder,
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <View style={styles.content}>
        {icon && <View style={[styles.icon, { marginRight: tokens.spacing.xs }]}>{icon}</View>}
        {typeof children === 'string' ? (
          <Text variant={textVariant} tone={variant === 'ghost' ? 'default' : 'default'} weight="medium" style={styles.label}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
  ghostBorder: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
