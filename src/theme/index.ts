export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F1ECE4',
  border: '#E5DED3',
  text: '#1F1A17',
  textMuted: '#6B625B',
  primary: '#7A3E1D',
  primaryPressed: '#5E2F15',
  onPrimary: '#FFFFFF',
  accent: '#D9822B',
  danger: '#B3261E',
  success: '#2E7D32',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const font = {
  caption: 12,
  body: 15,
  title: 17,
  heading: 22,
  display: 28,
} as const;
