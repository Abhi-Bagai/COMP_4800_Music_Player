import { Button } from '@/components/ui/button';
import { cloneElement, isValidElement } from 'react';
import { PressableProps } from 'react-native';

export interface IconButtonProps extends PressableProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'primary' | 'danger';
  icon: React.ReactNode;
}

// Map tone to Button variant
const mapToneToVariant = (tone: string) => {
  switch (tone) {
    case 'primary':
      return 'default';
    case 'danger':
      return 'destructive';
    default:
      return 'ghost';
  }
};

// Map size to Button size
const mapSizeToButtonSize = (size: string) => {
  switch (size) {
    case 'sm':
      return 'sm';
    case 'lg':
      return 'lg';
    default:
      return 'default';
  }
};

export function IconButton({ size = 'md', tone = 'default', icon, ...rest }: IconButtonProps) {
  const variant = mapToneToVariant(tone);
  const buttonSize = mapSizeToButtonSize(size);
  
  const renderedIcon = isValidElement(icon) ? icon : icon;

  return (
    <Button
      variant={variant}
      size={buttonSize}
      {...rest}
    >
      {renderedIcon}
    </Button>
  );
}
