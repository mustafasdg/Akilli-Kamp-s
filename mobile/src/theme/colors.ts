const colors = {
  // Arkaplan
  background:    '#F1F5F9',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F8FAFC',

  // Marka rengi
  primary:       '#1D4ED8',
  primaryLight:  '#DBEAFE',
  primaryDark:   '#1E3A8A',

  // Metin
  text:          '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',

  // Kenarlık
  border:        '#E2E8F0',
  borderLight:   '#F1F5F9',

  // Durum renkleri
  success:       '#10B981',
  successLight:  '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  error:         '#EF4444',
  errorLight:    '#FEE2E2',

  // Kategori badge'leri
  badge: {
    genel:    { bg: '#DBEAFE', text: '#1D4ED8' },
    akademik: { bg: '#D1FAE5', text: '#065F46' },
    spor:     { bg: '#FEF3C7', text: '#92400E' },
    sosyal:   { bg: '#EDE9FE', text: '#5B21B6' },
    duyuru:   { bg: '#FCE7F3', text: '#9D174D' },
  },
} as const;

export default colors;
