import { Text as RNRText, TextProps as RNRTextProps } from '@/components/ui/text';
import { TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'default' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'code' | 'lead' | 'large' | 'small' | 'muted';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: 'default' | 'subtle' | 'accent' | 'danger' | 'success';
  weight?: 'regular' | 'medium' | 'bold';
}

// Map old variants to new variants
const mapVariant = (variant: TextVariant): RNRTextProps['variant'] => {
  switch (variant) {
    case 'title':
      return 'h1';
    case 'subtitle':
      return 'h2';
    case 'body':
      return 'p';
    case 'caption':
      return 'small';
    case 'mono':
      return 'code';
    default:
      return variant as RNRTextProps['variant'];
  }
};

export function Text({
  variant = 'body',
  tone = 'default',
  weight = 'regular',
  style,
  ...rest
}: TextProps) {
  const mappedVariant = mapVariant(variant);

  // Map tone to className for color styling
  const toneClass = {
    default: '',
    subtle: 'text-muted-foreground',
    accent: 'text-accent-foreground',
    danger: 'text-destructive',
    success: 'text-green-600',
  }[tone];

  // Map weight to className
  const weightClass = {
    regular: 'font-normal',
    medium: 'font-medium',
    bold: 'font-bold',
  }[weight];

  return (
    <RNRText
      variant={mappedVariant}
      className={`${toneClass} ${weightClass}`}
      style={style}
      {...rest}
    />
  );
}
