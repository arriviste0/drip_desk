import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Check } from 'phosphor-react-native';
import { colors } from '../../lib/theme';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface NBAvatarProps {
  uri?: string;
  size?: AvatarSize;
  isVerified?: boolean;
}

const DIM: Record<AvatarSize, number> = { sm: 36, md: 52, lg: 84 };
const BADGE_DIM: Record<AvatarSize, number> = { sm: 14, md: 20, lg: 26 };

export function NBAvatar({ uri, size = 'md', isVerified = false }: NBAvatarProps) {
  const dim = DIM[size];
  const badgeDim = BADGE_DIM[size];

  return (
    <View style={{ width: dim, height: dim }}>
      <Image
        source={uri ? { uri } : require('../../assets/icon.png')}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: 2,
          borderColor: colors.white,
        }}
        contentFit="cover"
      />
      {isVerified ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: badgeDim,
            height: badgeDim,
            borderRadius: badgeDim / 2,
            backgroundColor: colors.blue,
            borderWidth: 2,
            borderColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check color={colors.white} size={badgeDim * 0.55} weight="bold" />
        </View>
      ) : null}
    </View>
  );
}
