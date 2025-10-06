import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { Text, TextProps } from './text';
import { useTheme } from '@/src/theme/provider';

export interface ListItemProps extends PropsWithChildren<PressableProps> {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  dense?: boolean;
  titleProps?: Partial<TextProps>;
}

export function ListItem({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  dense,
  titleProps,
  style,
  ...rest
}: ListItemProps) {
  const { tokens } = useTheme();
  const verticalPadding = dense ? tokens.spacing.xs : tokens.spacing.sm;

  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        styles.container,
        {
          paddingVertical: verticalPadding,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: pressed ? tokens.colors.surfaceElevated : tokens.colors.surface,
        },
        style,
      ]}
    >
      {leading && <View style={[styles.leading, { marginRight: tokens.spacing.md }]}>{leading}</View>}
      <View style={styles.content}>
        <Text variant={dense ? 'body' : 'subtitle'} weight="medium" {...titleProps}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" tone="subtle">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {(meta || trailing) && (
        <View style={[styles.trailing, { marginLeft: tokens.spacing.md }]}> 
          {meta ? (
            <Text variant="caption" tone="subtle">
              {meta}
            </Text>
          ) : null}
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
