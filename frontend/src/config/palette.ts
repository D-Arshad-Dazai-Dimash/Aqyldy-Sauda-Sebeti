export const palette = {
  white: '#FFFFFF',
  paper: '#F8FCFB',
  softBlue: '#EFF7FF',
  softGray: '#E2E8F0',
  background: '#F3F8F7',
  surface: '#FFFFFF',
  cardSoft: '#E8F5F3',

  ink: '#0A1E1D',
  text: '#0A1E1D',
  textMuted: '#527673',
  muted: '#64748B',
  faint: '#94A3B8',

  border: '#CAE5E1',
  mint: '#1A9A88',
  mintDark: '#0D6B5C',
  mintSoft: '#D4F0EB',
  sky: '#0EA5E9',
  blue: '#3B82F6',
  lime: '#84CC16',
  pink: '#EC4899',
  fire: '#E63946',
  rose: '#E63946',
  gold: '#D97706',
  dark: '#0A2422',
} as const;

export type Palette = typeof palette;