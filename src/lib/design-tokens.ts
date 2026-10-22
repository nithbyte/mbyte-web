/**
 * MByte Unified Design Tokens (Web Specification)
 * Matches mobile/src/constants/colors.ts and theme.ts 1:1
 * Adheres to classic, professional pharmaceutical SaaS visual language.
 */

export const colors = {
  // Official NITHBYTE Brand Identity
  brand: {
    primaryOrange: '#FF6B00',   // Primary accent & action color
    deepOrange: '#F45100',      // Deep orange hover / active
    warmOffWhite: '#F5F3EE',    // Primary light workspace background
    white: '#FFFFFF',           // Card and surface background
    primaryText: '#171717',     // Dark charcoal text
    secondaryText: '#525252',   // Secondary readable text
    border: '#E5E1D9',          // Clean border token
    darkBackground: '#171717',  // Primary dark workspace background
    darkSurface: '#242424',     // Dark card surface
    darkBorder: '#333333',      // Dark border

    // Backwards-compatible aliases for legacy properties
    midnightNavy: '#171717',
    navyCard: '#242424',
    deepSpaceBorder: '#333333',
    deepBlue: '#FF6B00',
    azure: '#F45100',
    cyan: '#FF8533',
    electricCyan: '#FFA366',
    mintGreen: '#15803D',
    emerald: '#15803D',
    darkWordmark: '#171717',
    lightWordmark: '#FFFFFF'
  },

  // Charcoal & Slate Neutral Scale
  primary: {
    900: '#171717', // Primary dark charcoal
    800: '#242424', // Dark surface
    700: '#333333', // Subdued dark border
    600: '#525252', // Secondary text
    500: '#737373', // Muted text, placeholders
    400: '#A3A3A3', // Neutral outline
    300: '#D4D4D4', // Subdued borders
    200: '#E5E1D9', // Card borders, inputs
    100: '#F5F3EE', // Surface secondary / warm off-white
    50: '#FAF8F5'   // Light workspace background tint
  },

  // Official NITHBYTE Orange Accent
  accent: {
    700: '#C23B00', // Button active / pressed
    600: '#F45100', // Deep orange hover
    500: '#FF6B00', // Primary NITHBYTE Orange
    400: '#FF8533', // Highlight orange
    300: '#FFA366', // Soft orange
    200: '#FFC299', // Tinted orange border
    100: '#FFE5D4', // Light active background
    50: '#FFF7ED'   // Lightest orange tint
  },

  // Semantic Status Colors (WCAG AA Compliant)
  semantic: {
    success: '#15803D',      // Clinical Green 700
    successMint: '#22C55E',  // Vivid green for dark-theme
    successBg: '#F0FDF4',    // Soft green background
    warning: '#B45309',      // Clinical Amber 700
    warningBg: '#FFFBEB',    // Soft amber tint
    danger: '#DC2626',       // Clinical Crimson 600
    dangerBg: '#FEF2F2',     // Soft crimson tint
    info: '#2563EB',         // Clinical Blue 600
    infoBg: '#EFF6FF',       // Soft blue tint
    neutral: '#525252',      // Neutral text 600
    neutralBg: '#F5F3EE'     // Warm off-white neutral tint
  },

  // Light Theme Color Set (NITHBYTE Warm Off-White & Orange)
  light: {
    background: '#F5F3EE',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E5E1D9',
    borderSubdued: '#EDEAE3',
    textPrimary: '#171717',
    textSecondary: '#525252',
    textMuted: '#737373',
    accent: '#FF6B00',
    accentSecondary: '#F45100',
    cardShadow: 'rgba(23, 23, 23, 0.04)'
  },

  // Dark Theme Color Set (NITHBYTE Charcoal & Orange)
  dark: {
    background: '#171717',
    surface: '#242424',
    surfaceElevated: '#2C2C2C',
    border: '#333333',
    borderSubdued: '#2C2C2C',
    textPrimary: '#F5F3EE',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    accent: '#FF6B00',
    accentSecondary: '#F45100',
    cardShadow: 'rgba(0, 0, 0, 0.4)'
  },

  // Baseline
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent'
} as const;

export const theme = {
  colors,
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.25rem',  // 20px
    xxl: '1.5rem',  // 24px
    xxxl: '2rem'    // 32px
  },
  borderRadius: {
    xs: '0.25rem',  // 4px
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    full: '9999px'
  },
  typography: {
    display: {
      fontSize: '1.75rem', // 28px
      fontWeight: '700',
      lineHeight: '2.125rem'
    },
    h1: {
      fontSize: '1.375rem', // 22px
      fontWeight: '600',
      lineHeight: '1.75rem'
    },
    h2: {
      fontSize: '1.125rem', // 18px
      fontWeight: '600',
      lineHeight: '1.5rem'
    },
    subtitle: {
      fontSize: '1rem', // 16px
      fontWeight: '600',
      lineHeight: '1.375rem'
    },
    bodyLarge: {
      fontSize: '1rem', // 16px
      fontWeight: '500',
      lineHeight: '1.375rem'
    },
    body: {
      fontSize: '0.875rem', // 14px
      fontWeight: '400',
      lineHeight: '1.25rem'
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: '500',
      lineHeight: '1rem'
    },
    overline: {
      fontSize: '0.6875rem', // 11px
      fontWeight: '700',
      lineHeight: '0.875rem',
      letterSpacing: '0.03em',
      textTransform: 'uppercase'
    }
  },
  touchTarget: {
    minHeight: '48px',
    minWidth: '48px'
  }
} as const;

export type DesignTokens = typeof theme;
