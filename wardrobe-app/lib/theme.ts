export const colors = {
  // Bento & Pinterest UI Palette
  yellow: '#FACC15',
  pink: '#F472B6',
  lime: '#A3E635',
  blue: '#3B82F6',
  red: '#EF4444',
  black: '#18181B',
  white: '#FFFFFF',
  paper: '#F7F7FA',
  offwhite: '#F3F4F6',

  // Bento Specific Accents & Blush Theme
  bentoBlush: '#FDF0F0',
  bentoRoseSoft: '#FCE8E8',
  bentoBlushDark: '#F9DCDC',
  bentoSuccessGreen: '#22C55E',
  bentoMint: '#3B7A57',
  bentoMintLight: '#D1F2D9',
  bentoLavender: '#E8E3FF',
  bentoPurple: '#6E56CF',
  bentoYellow: '#FEF9C3',
  bentoRose: '#FCE7F3',
  bentoOnyx: '#111115',
  bentoGray: '#E5E7EB',
  bentoPaper: '#F3F4F6',
  bentoBorder: 'rgba(0, 0, 0, 0.06)',
};

export const typography = {
  display:  { fontFamily: 'SpaceGrotesk-Bold', fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  heading:  { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, lineHeight: 28, letterSpacing: -0.3 },
  subhead:  { fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, lineHeight: 18, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  body:     { fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, lineHeight: 20 },
  caption:  { fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, lineHeight: 14, letterSpacing: 0.5 },
  price:    { fontFamily: 'SpaceGrotesk-Bold', fontSize: 20, lineHeight: 24 },
};

export const radii = {
  card: 24,
  bento: 24,
  button: 9999,
  chip: 9999,
  badge: 9999,
  actionMenu: 28,
  header: 24,
  pill: 9999,
  avatar: 9999,
};

export const shadows = {
  // Soft ambient Bento & Pinterest drop shadows
  hard6: { shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  hard4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  hard3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  soft: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  softMd: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  softLg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 8 },
};
