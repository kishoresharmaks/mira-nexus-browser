export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  bg: string;
  bgTop: string;
  bgBottom: string;
  surface: string;
  surfaceAlt: string;
  chip: string;
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
  line: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  danger: string;
  scrim: string;
  inverse: string;
  inverseInk: string;
  shadow: string;
  gradient: readonly [string, string];
};

export const themes: Record<ThemeMode, Theme> = {
  light: {
    mode: 'light',
    bg: '#F5F1E8',
    bgTop: '#FAF7F0',
    bgBottom: '#EEE8DC',
    surface: '#FFFCF6',
    surfaceAlt: '#F0EBE1',
    chip: '#F1ECE2',
    ink: '#191610',
    inkSoft: '#3C3830',
    muted: '#6C6457',
    faint: '#9A9182',
    line: 'rgba(25, 22, 16, 0.085)',
    accent: '#FF5A2B',
    accentInk: '#FFF9F3',
    accentSoft: '#FFE3D7',
    danger: '#C93F26',
    scrim: 'rgba(20, 17, 12, 0.38)',
    inverse: '#1B1813',
    inverseInk: '#F7F2E8',
    shadow: '#3B2E1F',
    gradient: ['#F9F5ED', '#EFE9DD'],
  },
  dark: {
    mode: 'dark',
    bg: '#0E0D0B',
    bgTop: '#151310',
    bgBottom: '#0A0908',
    surface: '#1A1815',
    surfaceAlt: '#24211C',
    chip: '#24211C',
    ink: '#F4EFE5',
    inkSoft: '#D9D2C6',
    muted: '#A39A8B',
    faint: '#6F685C',
    line: 'rgba(244, 239, 229, 0.1)',
    accent: '#FF6B3D',
    accentInk: '#1B0F08',
    accentSoft: '#3A2118',
    danger: '#FF7B5E',
    scrim: 'rgba(0, 0, 0, 0.58)',
    inverse: '#F4EFE5',
    inverseInk: '#16130E',
    shadow: '#000000',
    gradient: ['#14120F', '#0B0A09'],
  },
};

export const fonts = {
  serif: 'InstrumentSerif',
  serifItalic: 'InstrumentSerifItalic',
  sans: 'InstrumentSans',
  medium: 'InstrumentSansMedium',
  semibold: 'InstrumentSansSemiBold',
  bold: 'InstrumentSansBold',
} as const;

export const layout = {
  maxContentWidth: 640,
  screenPadding: 22,
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },
  toolbarHeight: 58,
} as const;

export function softShadow(mode: ThemeMode, strength: 'card' | 'dock' = 'card') {
  return {
    shadowColor: mode === 'dark' ? '#000000' : '#3B2E1F',
    shadowOffset: { width: 0, height: strength === 'dock' ? 12 : 8 },
    shadowOpacity: mode === 'dark' ? 0.4 : strength === 'dock' ? 0.14 : 0.07,
    shadowRadius: strength === 'dock' ? 26 : 18,
    elevation: strength === 'dock' ? 10 : 4,
  } as const;
}
