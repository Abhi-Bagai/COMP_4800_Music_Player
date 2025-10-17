import { Button as RNRButton, ButtonProps as RNRButtonProps } from '@/components/ui/button';
import { PropsWithChildren } from 'react';
import { PressableProps } from 'react-native';

export type ButtonVariant = 'primary' | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends PropsWithChildren<PressableProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

// Map old variants to new variants
const mapVariant = (variant: ButtonVariant): RNRButtonProps['variant'] => {
  switch (variant) {
    case 'primary':
      return 'default';
    case 'secondary':
      return 'secondary';
    case 'ghost':
      return 'ghost';
    default:
      return variant as RNRButtonProps['variant'];
  }
};

// Map old sizes to new sizes
const mapSize = (size: ButtonSize): RNRButtonProps['size'] => {
  switch (size) {
    case 'sm':
      return 'sm';
    case 'md':
      return 'default';
    case 'lg':
      return 'lg';
    default:
      return size as RNRButtonProps['size'];
  }
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  ...rest
}: ButtonProps) {
  const mappedVariant = mapVariant(variant);
  const mappedSize = mapSize(size);

  return (
    <RNRButton
      variant={mappedVariant}
      size={mappedSize}
      {...rest}
    >
      {icon && icon}
      {children}
    </RNRButton>
  );
}

// Styles removed - now using React Native Reusables styling
