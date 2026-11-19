import { useWindowDimensions } from 'react-native';

/**
 * BudgetBuddy design tokens — one consistent system for the whole app.
 *
 * Identity: a money ledger that feels calm, not corporate. Deep violet
 * (#5A2EE6) is the one disciplined theme color, lime (#A3E635) is the
 * accent used sparingly for coach highlights and positive deltas, on a
 * warm paper background (#FBF8F3). Space Grotesk (bold grotesque) is
 * the display face — deliberately different from FridgeToMeal/MediGuide's
 * Sora, SplitEase's Fraunces, PlantDoctor's Bricolage Grotesque and
 * CivicHelper's Archivo. The data hero is a budget ring, not a photo.
 */

export const palette = {
  // Brand — one disciplined deep violet.
  primary: '#5A2EE6',
  primaryDeep: '#3D1DB0',
  primaryLight: '#7C55F0',
  primarySoft: '#E4DBFB',
  primaryPale: '#F1EDFD',
  // Lime accent — coach highlights and positive deltas only.
  accent: '#A3E635',
  accentDeep: '#65A30D',
  accentSoft: '#EFFBD9',
  // Neutrals (warm-paper tinted so the whole UI feels one family).
  ink: '#241F2E',
  body: '#4C4658',
  muted: '#8B8496',
  line: 'rgba(36, 31, 46, 0.10)',
  surface: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.62)',
  glassStrong: 'rgba(255, 255, 255, 0.80)',
  sheet: 'rgba(255, 255, 255, 0.88)',
  // Aurora background stops — warm paper with a violet tint.
  aurora: ['#FBF8F3', '#F1EDFD', '#EFE9F9'] as const,
  // Spending semantics.
  over: '#C0392B',
  overSoft: '#F6DCD6',
  onTrack: '#65A30D',
  onTrackSoft: '#EFFBD9',
  soon: '#B97F1F',
  soonSoft: '#FBF3DC',
  // Status.
  warning: '#B97F1F',
  warningSoft: '#FBF3DC',
  error: '#B3261E',
  errorSoft: '#FCE8E6',
  success: '#65A30D',
  successSoft: '#EFFBD9',
} as const;

/** Category colors (cycled by category index). */
export const categoryColors: Record<string, string> = {
  food: '#E07840',
  transport: '#3E6B8E',
  shopping: '#B23A48',
  fun: '#8B5CF6',
  bills: '#5A2EE6',
  health: '#65A30D',
  other: '#8B8496',
};

/** Backwards-compatible alias used by shared UI components. */
export const memberColors = [
  '#5A2EE6',
  '#A3E635',
  '#E07840',
  '#3E6B8E',
  '#B23A48',
  '#65A30D',
  '#B97F1F',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  card: 30,
  sheet: 38,
  pill: 999,
  input: 24,
} as const;

/**
 * Display typeface — Space Grotesk (bundled via
 * @expo-google-fonts/space-grotesk, loaded in app/_layout.tsx). Used
 * for headlines, screen titles and big numbers; body text stays on the
 * system font.
 */
export const font = {
  display: 'SpaceGrotesk_700Bold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 42, lineHeight: 46, letterSpacing: -0.5 },
  displayWide: { fontFamily: font.display, fontSize: 56, lineHeight: 60, letterSpacing: -0.5 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.2 },
  subtitle: { fontFamily: font.bold, fontSize: 17, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 1.1 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#241F2E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#5A2EE6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  limeGlow: {
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#241F2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type Breakpoint = 'compact' | 'medium' | 'wide' | 'desktop';

export interface Responsive {
  breakpoint: Breakpoint;
  width: number;
  /** Max width for the centered content column. */
  contentMaxWidth: number;
  /** Horizontal page padding. */
  pad: number;
  /** Columns for card grids. */
  columns: number;
  /** Two-pane list + detail layout (foldable unfolded / tablet / desktop). */
  twoPane: boolean;
  display: typeof type.display | typeof type.displayWide;
}

export function useResponsive(): Responsive {
  const { width } = useWindowDimensions();
  if (width < 600) {
    return {
      breakpoint: 'compact',
      width,
      contentMaxWidth: width,
      pad: 20,
      columns: 1,
      twoPane: false,
      display: type.display,
    };
  }
  if (width < 840) {
    return {
      breakpoint: 'medium',
      width,
      contentMaxWidth: 640,
      pad: 28,
      columns: 1,
      twoPane: false,
      display: type.displayWide,
    };
  }
  if (width < 1280) {
    return {
      breakpoint: 'wide',
      width,
      contentMaxWidth: 1024,
      pad: 32,
      columns: 2,
      twoPane: true,
      display: type.displayWide,
    };
  }
  return {
    breakpoint: 'desktop',
    width,
    contentMaxWidth: 1120,
    pad: 40,
    columns: 3,
    twoPane: true,
    display: type.displayWide,
  };
}
