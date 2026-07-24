import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../lib/theme';

export type NBBadgeVariant = 'default' | 'sale' | 'new' | 'neutral';

interface NBBadgeProps {
  label: string;
  variant?: NBBadgeVariant;
}

const BG: Record<NBBadgeVariant, string> = {
  default: colors.bentoYellow,
  sale: colors.bentoRose,
  new: colors.bentoMintLight,
  neutral: colors.bentoLavender,
};

const TEXT: Record<NBBadgeVariant, string> = {
  default: colors.black,
  sale: '#BE185D',
  new: colors.bentoMint,
  neutral: colors.bentoPurple,
};

export function NBBadge({ label, variant = 'default' }: NBBadgeProps) {
  return (
    <View
      style={{
        backgroundColor: BG[variant],
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        borderRadius: 9999,
        paddingVertical: 3,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 10,
          color: TEXT[variant],
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
