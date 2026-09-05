import '@/global.css';

// Exact Stitch Design System: "Midnight Elegance" (from projects/2123604981332118949)
export const MidnightEleganceTheme = {
  name: 'Midnight Elegance',
  colors: {
    // Level 0: Foundations
    midnightVoid: '#0C0F10', // Level 0 Base Midnight Void from design.md
    surface: '#121414', // Exact surface from design.md
    surfaceDim: '#121414',
    surfaceBright: '#38393A',
    surfaceContainerLowest: '#0C0F0F',
    surfaceContainerLow: '#1A1C1C',
    surfaceContainer: '#1E2020',
    surfaceContainerHigh: '#282A2B',
    surfaceContainerHighest: '#333535',
    surfaceVariant: '#333535',
    background: '#121414',

    // Content
    onSurface: '#E2E2E2',
    onBackground: '#E2E2E2',
    onSurfaceVariant: '#DFBEC6',

    // Primary Accents (Neon Magenta & Pinks)
    primary: '#FFB1C6',
    primaryContainer: '#F65592',
    onPrimary: '#650031',
    onPrimaryContainer: '#59002A',
    inversePrimary: '#B31D5F',
    neonMagenta: '#FF007F',
    superPinkGlow: '#FF69B4',

    // Secondary & Neutral Variants
    secondary: '#C5C7C8',
    secondaryContainer: '#444748',
    onSecondary: '#2E3132',
    onSecondaryContainer: '#B3B5B6',
    tertiary: '#C5C7C8',
    tertiaryContainer: '#8F9192',

    // Outlines & Borders
    outline: '#A68990',
    outlineVariant: '#584147',
    glassStroke: 'rgba(166, 137, 144, 0.15)',
    glassStrokeStrong: 'rgba(166, 137, 144, 0.25)',
    glassPanel: 'rgba(30, 32, 32, 0.65)',

    // System Indicators
    successGreen: '#4ADE80',
    liveGreen: '#4ADE80', // Vibrant green dot from design.md
    goldCoin: '#FFD700',
    error: '#FFB4AB',
    errorContainer: '#93000A',
  },
  spacing: {
    unit: 4,
    stackSm: 8,
    gutter: 16,
    stackMd: 16,
    containerMargin: 20,
    stackLg: 24,
    sectionGap: 40,
    containerMax: 1440,
  },
  rounded: {
    sm: 4,
    default: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  typography: {
    displayLg: {
      fontSize: 32,
      fontWeight: '800' as const,
      letterSpacing: -0.8,
    },
    headlineLg: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    headlineMd: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    headlineSm: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    bodyLg: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMd: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    labelMd: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
  shadows: {
    neonGlow: {
      shadowColor: '#F65592',
      shadowOpacity: 0.5,
      shadowRadius: 18,
      elevation: 8,
    },
    superGiftGlow: {
      shadowColor: '#FF69B4',
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
    softGlow: {
      shadowColor: '#F65592',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
  },
};

export const StitchTheme = MidnightEleganceTheme;

// Reusable Common Style Presets for 100% Design System Fidelity
export const CommonMidnightStyles = {
  screen: {
    flex: 1,
    backgroundColor: MidnightEleganceTheme.colors.midnightVoid,
  },
  surfaceScreen: {
    flex: 1,
    backgroundColor: MidnightEleganceTheme.colors.surface,
  },
  topHeader: {
    height: 64,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 20, 20, 0.85)',
  },
  glassPanel: {
    backgroundColor: MidnightEleganceTheme.colors.glassPanel,
    borderRadius: MidnightEleganceTheme.rounded.md,
  },
  glassCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 53, 53, 0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryPillBtn: {
    backgroundColor: MidnightEleganceTheme.colors.primaryContainer,
    borderRadius: MidnightEleganceTheme.rounded.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...MidnightEleganceTheme.shadows.neonGlow,
  },
  tagChip: {
    backgroundColor: 'rgba(51, 53, 53, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: MidnightEleganceTheme.rounded.full,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MidnightEleganceTheme.colors.liveGreen,
  },
};

export const Colors = {
  light: {
    text: MidnightEleganceTheme.colors.onSurface,
    background: MidnightEleganceTheme.colors.surface,
    backgroundElement: MidnightEleganceTheme.colors.surfaceContainer,
    backgroundSelected: MidnightEleganceTheme.colors.surfaceVariant,
    textSecondary: MidnightEleganceTheme.colors.onSurfaceVariant,
  },
  dark: {
    text: MidnightEleganceTheme.colors.onSurface,
    background: MidnightEleganceTheme.colors.surface,
    backgroundElement: MidnightEleganceTheme.colors.surfaceContainer,
    backgroundSelected: MidnightEleganceTheme.colors.surfaceVariant,
    textSecondary: MidnightEleganceTheme.colors.onSurfaceVariant,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Fonts = {
  regular: 'sans-serif',
  medium: 'sans-serif',
  bold: 'sans-serif',
  semiBold: 'sans-serif',
  light: 'sans-serif',
  mono: 'monospace',
};
