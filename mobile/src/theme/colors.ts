export const lightColors = {
  background:    '#F1F5F9',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F8FAFC',

  // ISUBÜ Kurumsal Lacivert
  primary:       '#1E3A5F',
  primaryLight:  '#D6E4F0',
  primaryDark:   '#142A47',

  text:          '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',

  border:        '#E2E8F0',
  borderLight:   '#F1F5F9',

  success:       '#10B981',
  successLight:  '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  error:         '#EF4444',
  errorLight:    '#FEE2E2',

  badge: {
    genel:    { bg: '#DBEAFE', text: '#1D4ED8' },
    akademik: { bg: '#D1FAE5', text: '#065F46' },
    spor:     { bg: '#FEF3C7', text: '#92400E' },
    sosyal:   { bg: '#EDE9FE', text: '#5B21B6' },
    duyuru:   { bg: '#FCE7F3', text: '#9D174D' },
  },
} as const;

export const darkColors = {
  background:    '#0F172A',
  surface:       '#1E293B',
  surfaceAlt:    '#263348',

  primary:       '#4A90C4',
  primaryLight:  '#1E3A5F',
  primaryDark:   '#2E6A99',

  text:          '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted:     '#64748B',

  border:        '#334155',
  borderLight:   '#1E293B',

  success:       '#10B981',
  successLight:  '#064E3B',
  warning:       '#F59E0B',
  warningLight:  '#451A03',
  error:         '#F87171',
  errorLight:    '#450A0A',

  badge: {
    genel:    { bg: '#1E3A8A', text: '#93C5FD' },
    akademik: { bg: '#064E3B', text: '#6EE7B7' },
    spor:     { bg: '#451A03', text: '#FCD34D' },
    sosyal:   { bg: '#2E1065', text: '#C4B5FD' },
    duyuru:   { bg: '#500724', text: '#F9A8D4' },
  },
} as const;

// AppColors: her iki paleti kapsayan esnek tip
export type AppColors = {
  [K in keyof typeof lightColors]: K extends 'badge'
    ? { [B in keyof typeof lightColors['badge']]: { bg: string; text: string } }
    : string;
};

// Geriye dönük uyumluluk için default export (light tema)
const colors = lightColors;
export default colors;
