# Theme System Documentation

## Overview

Starlight uses a custom theme system that provides consistent design tokens across the application. The theme supports both light and dark modes and is fully integrated with React Native components.

## Architecture

```
┌─────────────────────────────────────┐
│      Theme Provider                 │
│  (Context Provider)                 │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Theme Tokens                   │
│  (Design System)                    │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Components                     │
│  (useTheme hook)                    │
└─────────────────────────────────────┘
```

## Theme Provider

**File:** `src/theme/provider.tsx`

The theme provider wraps the application and provides theme context to all components.

### Setup

```typescript
import { ThemeProvider } from '@/src/theme/provider';

export default function RootLayout() {
  return (
    <ThemeProvider initialMode="dark">
      {/* App content */}
    </ThemeProvider>
  );
}
```

### Usage in Components

```typescript
import { useTheme } from '@/src/theme/provider';

function MyComponent() {
  const { tokens, mode } = useTheme();
  
  return (
    <View style={{ backgroundColor: tokens.colors.background }}>
      <Text style={{ color: tokens.colors.text }}>Hello</Text>
    </View>
  );
}
```

### API

**ThemeProvider Props:**
- `initialMode`: `'light' | 'dark'` - Initial theme mode (defaults to system preference)

**useTheme Hook Returns:**
- `mode`: Current theme mode (`'light' | 'dark'`)
- `tokens`: Theme tokens object

## Theme Tokens

**File:** `src/theme/tokens.ts`

Design tokens organized by category.

### Color Tokens

#### Light Theme Colors

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#F7F9FB` | Main app background |
| `surface` | `#FFFFFF` | Card/surface background |
| `surfaceElevated` | `#EDF1F7` | Elevated surfaces |
| `primary` | `#2563EB` | Primary actions, accents |
| `primaryMuted` | `#AEC8FF` | Muted primary color |
| `onPrimary` | `#FFFFFF` | Text on primary background |
| `secondary` | `#6366F1` | Secondary actions |
| `onSecondary` | `#FFFFFF` | Text on secondary background |
| `text` | `#0F172A` | Primary text |
| `subtleText` | `#475569` | Secondary/subtle text |
| `border` | `#CBD5F5` | Borders, dividers |
| `accent` | `#14B8A6` | Accent color |
| `danger` | `#EF4444` | Error, destructive actions |
| `success` | `#22C55E` | Success states |

#### Dark Theme Colors

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#1A1A1A` | Main app background |
| `surface` | `#2A2A2A` | Card/surface background |
| `surfaceElevated` | `#3A3A3A` | Elevated surfaces |
| `primary` | `#8B5CF6` | Primary actions, accents (purple) |
| `primaryMuted` | `#4C1D95` | Muted primary color |
| `onPrimary` | `#FFFFFF` | Text on primary background |
| `secondary` | `#818CF8` | Secondary actions |
| `onSecondary` | `#0B1120` | Text on secondary background |
| `text` | `#FFFFFF` | Primary text |
| `subtleText` | `#A1A1AA` | Secondary/subtle text |
| `border` | `#404040` | Borders, dividers |
| `accent` | `#8B5CF6` | Accent color (purple) |
| `danger` | `#F87171` | Error, destructive actions |
| `success` | `#4ADE80` | Success states |

### Spacing Tokens

| Token | Value (px) | Usage |
|-------|------------|-------|
| `none` | `0` | No spacing |
| `xs` | `4` | Tight spacing |
| `sm` | `8` | Small spacing |
| `md` | `12` | Medium spacing |
| `lg` | `16` | Large spacing |
| `xl` | `24` | Extra large spacing |
| `xxl` | `32` | Extra extra large spacing |

**Usage:**
```typescript
<View style={{ padding: tokens.spacing.lg }}>
  <Text>Content</Text>
</View>
```

### Radius Tokens

| Token | Value (px) | Usage |
|-------|------------|-------|
| `none` | `0` | Sharp corners |
| `sm` | `4` | Small radius |
| `md` | `8` | Medium radius |
| `lg` | `16` | Large radius |
| `pill` | `999` | Fully rounded (pills, circles) |

**Usage:**
```typescript
<View style={{ 
  borderRadius: tokens.radius.md,
  backgroundColor: tokens.colors.surface 
}}>
  <Text>Rounded Card</Text>
</View>
```

### Font Size Tokens

| Token | Value (px) | Usage |
|-------|------------|-------|
| `xs` | `12` | Small text, captions |
| `sm` | `14` | Body text, secondary |
| `md` | `16` | Default body text |
| `lg` | `20` | Large text, subtitles |
| `xl` | `24` | Headings |
| `xxl` | `32` | Large headings |

**Usage:**
```typescript
<Text style={{ fontSize: tokens.fontSize.lg }}>
  Large Text
</Text>
```

### Typography Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `weightRegular` | `"400"` | Regular font weight |
| `weightMedium` | `"500"` | Medium font weight |
| `weightBold` | `"600"` | Bold font weight |
| `family` | `"System"` | Primary font family |
| `monoFamily` | `"Menlo"` | Monospace font family |

**Usage:**
```typescript
<Text style={{ 
  fontFamily: tokens.typography.family,
  fontWeight: tokens.typography.weightBold 
}}>
  Bold Text
</Text>
```

## Color Roles

### Semantic Color Usage

Colors are organized by semantic meaning:

**Background Colors:**
- `background` - Main app background
- `surface` - Cards, panels, elevated content
- `surfaceElevated` - Higher elevation surfaces

**Primary Colors:**
- `primary` - Main brand color, primary actions
- `primaryMuted` - Softer primary variant
- `onPrimary` - Text/icons on primary background

**Text Colors:**
- `text` - Primary text content
- `subtleText` - Secondary text, hints, labels

**State Colors:**
- `accent` - Accent actions, highlights
- `danger` - Errors, destructive actions
- `success` - Success states, confirmations

**Utility Colors:**
- `border` - Borders, dividers, separators
- `secondary` - Secondary actions
- `onSecondary` - Text on secondary background

## Theme Modes

### Light Mode

- Clean, bright interface
- Blue primary color (`#2563EB`)
- High contrast for readability
- Suitable for daytime use

### Dark Mode

- Dark background (`#1A1A1A`)
- Purple primary color (`#8B5CF6`)
- Reduced eye strain
- Suitable for low-light environments

### Mode Detection

The theme provider automatically detects system preference:

```typescript
const nativeColorScheme = useColorScheme(); // 'light' | 'dark' | null
const mode = initialMode ?? (nativeColorScheme ?? 'light');
```

**Priority:**
1. `initialMode` prop (if provided)
2. System preference (from `useColorScheme()`)
3. Default to `'light'`

## Best Practices

### 1. Always Use Theme Tokens

**✅ Good:**
```typescript
const { tokens } = useTheme();
<View style={{ backgroundColor: tokens.colors.background }} />
```

**❌ Bad:**
```typescript
<View style={{ backgroundColor: '#FFFFFF' }} />
```

### 2. Use Semantic Color Names

**✅ Good:**
```typescript
<Text style={{ color: tokens.colors.text }} />
<Button style={{ backgroundColor: tokens.colors.primary }} />
```

**❌ Bad:**
```typescript
<Text style={{ color: tokens.colors.primary }} /> // Wrong semantic meaning
```

### 3. Use Spacing Tokens

**✅ Good:**
```typescript
<View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.md }} />
```

**❌ Bad:**
```typescript
<View style={{ padding: 16, gap: 12 }} />
```

### 4. Use Radius Tokens

**✅ Good:**
```typescript
<View style={{ borderRadius: tokens.radius.md }} />
```

**❌ Bad:**
```typescript
<View style={{ borderRadius: 8 }} />
```

### 5. Responsive to Theme Mode

Components should automatically adapt to theme changes:

```typescript
// ✅ Automatically adapts
const { tokens } = useTheme();
<View style={{ backgroundColor: tokens.colors.surface }} />

// ❌ Hardcoded, won't adapt
<View style={{ backgroundColor: '#FFFFFF' }} />
```

## Component Integration

### Base Components

Base UI components (`src/components/ui/`) are theme-aware:

- `Button` - Uses `primary`, `onPrimary`, `secondary`, etc.
- `Text` - Uses `text`, `subtleText` based on variant
- `Surface` - Uses `surface`, `surfaceElevated`
- `IconButton` - Uses theme colors for icons

### Custom Components

All custom components should use theme tokens:

```typescript
function MyComponent() {
  const { tokens } = useTheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: tokens.colors.surface }
    ]}>
      <Text style={{ color: tokens.colors.text }}>
        Themed Content
      </Text>
    </View>
  );
}
```

## Theme Customization

### Adding New Colors

Edit `src/theme/tokens.ts`:

```typescript
const lightColors: ThemeTokens["colors"] = {
  // ... existing colors
  warning: "#F59E0B", // Add new color
};

const darkColors: ThemeTokens["colors"] = {
  // ... existing colors
  warning: "#FBBF24", // Dark mode variant
};
```

### Adding New Spacing Values

```typescript
const baseSpacing: ThemeTokens["spacing"] = {
  // ... existing values
  xxxl: 48, // Add new spacing
};
```

### Changing Theme Mode

```typescript
// In root layout
<ThemeProvider initialMode="dark"> // Force dark mode
<ThemeProvider initialMode="light"> // Force light mode
<ThemeProvider> // Use system preference
```

## Future Enhancements

Potential theme system improvements:

- [ ] Dynamic theme switching (user preference)
- [ ] Custom theme colors (user customization)
- [ ] More color variants (e.g., `primaryLight`, `primaryDark`)
- [ ] Animation tokens (duration, easing)
- [ ] Shadow tokens
- [ ] Breakpoint tokens (for responsive design)
- [ ] Theme persistence (save user preference)

## Accessibility

Theme system supports accessibility:

- High contrast colors for readability
- Sufficient color contrast ratios
- Text sizes that scale with system settings
- Color-blind friendly palette

**Note:** Ensure sufficient contrast between text and background:
- `text` on `background` - ✅ Good contrast
- `subtleText` on `surface` - ✅ Good contrast
- Always test with accessibility tools

