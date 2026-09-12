import "@/global.css";

// Exact Stitch Design System: "Midnight Elegance" (from projects/2123604981332118949)
export const MidnightEleganceTheme = {
  name: "Midnight Elegance",
  colors: {
    // Level 0: Foundations
    midnightVoid: "#0C0F10", // Level 0 Base Midnight Void from design.md
    surface: "#121414", // Exact surface from design.md
    surfaceDim: "#121414",
    surfaceBright: "#38393A",
    surfaceContainerLowest: "#0C0F0F",
    surfaceContainerLow: "#1A1C1C",
    surfaceContainer: "#1E2020",
    surfaceContainerHigh: "#282A2B",
    surfaceContainerHighest: "#333535",
    surfaceVariant: "#333535",
    background: "#121414",

    // Content
    onSurface: "#E2E2E2",
    onBackground: "#E2E2E2",
    onSurfaceVariant: "#DFBEC6",

    // Primary Accents (Neon Magenta & Pinks)
    primary: "#FFB1C6",
    primaryContainer: "#F65592",
    onPrimary: "#650031",
    onPrimaryContainer: "#59002A",
    inversePrimary: "#B31D5F",
    neonMagenta: "#FF007F",
    superPinkGlow: "#FF69B4",

    // Secondary & Neutral Variants
    secondary: "#C5C7C8",
    secondaryContainer: "#444748",
    onSecondary: "#2E3132",
    onSecondaryContainer: "#B3B5B6",
    tertiary: "#C5C7C8",
    tertiaryContainer: "#8F9192",

    // Outlines & Borders
    outline: "#A68990",
    outlineVariant: "#584147",
    glassStroke: "rgba(166, 137, 144, 0.15)",
    glassStrokeStrong: "rgba(166, 137, 144, 0.25)",
    glassPanel: "rgba(30, 32, 32, 0.65)",

    // System Indicators
    successGreen: "#4ADE80",
    liveGreen: "#4ADE80", // Vibrant green dot from design.md
    goldCoin: "#FFD700",
    error: "#FFB4AB",
    errorContainer: "#93000A",
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
      fontWeight: "800" as const,
      letterSpacing: -0.8,
    },
    headlineLg: {
      fontSize: 28,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
    },
    headlineMd: {
      fontSize: 24,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
    headlineSm: {
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 28,
    },
    bodyLg: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 24,
    },
    bodyMd: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 20,
    },
    labelMd: {
      fontSize: 12,
      fontWeight: "500" as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
  shadows: {
    neonGlow: {},
    superGiftGlow: {},
    softGlow: {},
  },
};

export const DaylightEleganceTheme = {
  name: "Daylight Elegance",
  colors: {
    // Level 0: Foundations
    midnightVoid: "#F6F7F9",
    surface: "#FFFFFF",
    surfaceDim: "#EDEDF1",
    surfaceBright: "#FFFFFF",
    surfaceContainerLowest: "#FFFFFF",
    surfaceContainerLow: "#F8F9FA",
    surfaceContainer: "#F1F3F5",
    surfaceContainerHigh: "#E9ECEF",
    surfaceContainerHighest: "#DEE2E6",
    surfaceVariant: "#E9ECEF",
    background: "#F6F7F9",

    // Content
    onSurface: "#191C1D",
    onBackground: "#191C1D",
    onSurfaceVariant: "#5D6066",

    // Primary Accents (Rose Magenta & Pinks)
    primary: "#F65592",
    primaryContainer: "#F65592",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#59002A",
    inversePrimary: "#FFB1C6",
    neonMagenta: "#E0006C",
    superPinkGlow: "#FF69B4",

    // Secondary & Neutral Variants
    secondary: "#505459",
    secondaryContainer: "#E2E6EA",
    onSecondary: "#212529",
    onSecondaryContainer: "#343A40",
    tertiary: "#6C757D",
    tertiaryContainer: "#CED4DA",

    // Outlines & Borders
    outline: "#CED4DA",
    outlineVariant: "#E5E7EB",
    glassStroke: "rgba(0, 0, 0, 0.08)",
    glassStrokeStrong: "rgba(0, 0, 0, 0.16)",
    glassPanel: "rgba(255, 255, 255, 0.85)",

    // System Indicators
    successGreen: "#16A34A",
    liveGreen: "#16A34A",
    goldCoin: "#D97706",
    error: "#DC2626",
    errorContainer: "#FEE2E2",
  },
  spacing: MidnightEleganceTheme.spacing,
  rounded: MidnightEleganceTheme.rounded,
  typography: MidnightEleganceTheme.typography,
  shadows: {
    neonGlow: {},
    superGiftGlow: {},
    softGlow: {},
  },
};

export type AppTheme = typeof MidnightEleganceTheme;
export const StitchTheme = MidnightEleganceTheme;

// Reusable Common Style Presets ,  Borderless Tonal Design Language
// Depth comes from tonal layering + soft shadows, not strokes.
// Selection: solid primary fill (small controls) or tinted fill (large cards).
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
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 20,
    backgroundColor: "rgba(18, 20, 20, 0.85)",
  },
  glassPanel: {
    backgroundColor: MidnightEleganceTheme.colors.glassPanel,
    borderRadius: MidnightEleganceTheme.rounded.md,
  },
  glassCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(51, 53, 53, 0.5)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  primaryPillBtn: {
    backgroundColor: MidnightEleganceTheme.colors.primaryContainer,
    borderRadius: MidnightEleganceTheme.rounded.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...MidnightEleganceTheme.shadows.neonGlow,
  },
  tagChip: {
    backgroundColor: "rgba(51, 53, 53, 0.4)",
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

// Borderless card presets ,  tonal surface layering only, no shadows
export const CommonDaylightStyles = {
  cardBorderlessDark: {
    backgroundColor: MidnightEleganceTheme.colors.surfaceContainer,
    borderRadius: 22,
  },
  cardBorderlessLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
  },
  // Selection fills
  selectedSolid: {
    backgroundColor: MidnightEleganceTheme.colors.primaryContainer,
  },
  selectedTintDark: {
    backgroundColor: "rgba(246, 85, 146, 0.18)",
  },
  selectedTintLight: {
    backgroundColor: "rgba(246, 85, 146, 0.10)",
  },
};

export const Colors = {
  light: {
    text: DaylightEleganceTheme.colors.onSurface,
    background: DaylightEleganceTheme.colors.surface,
    backgroundElement: DaylightEleganceTheme.colors.surfaceContainer,
    backgroundSelected: DaylightEleganceTheme.colors.surfaceVariant,
    textSecondary: DaylightEleganceTheme.colors.onSurfaceVariant,
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
  regular: "sans-serif",
  medium: "sans-serif",
  bold: "sans-serif",
  semiBold: "sans-serif",
  light: "sans-serif",
  mono: "monospace",
};
