import { Card } from '@/components/ui/card';
import { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';

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
  // Map variant to className
  const variantClass = {
    plain: 'bg-card',
    elevated: 'bg-card shadow-sm',
    tinted: 'bg-muted/50',
  }[variant];

  // Map padding to className
  const paddingClass = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  return (
    <Card
      className={`${variantClass} ${paddingClass}`}
      style={style}
      {...rest}
    >
      {children}
    </Card>
  );
}
