import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { NBBadge, NBCard } from '../ui';
import { MarketplaceListing, ListingCondition } from '../../types/marketplace';
import { formatINR } from '../../lib/format';
import { colors } from '../../lib/theme';

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new_with_tags: 'New w/ Tags',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
};

interface ListingCardProps {
  listing: MarketplaceListing;
  onPress?: () => void;
  width?: number;
}

export function ListingCard({ listing, onPress, width }: ListingCardProps) {
  return (
    <NBCard onPress={onPress} style={width ? { width } : undefined}>
      <View style={{ aspectRatio: 1, backgroundColor: colors.offwhite }}>
        <Image
          source={{ uri: listing.item.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
        />
        <View style={{ position: 'absolute', top: 8, left: 8 }}>
          <NBBadge label={CONDITION_LABELS[listing.condition]} variant="neutral" />
        </View>
      </View>

      <View style={{ padding: 10, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}
        >
          {listing.item.name}
        </Text>
        <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 16, color: colors.black }}>
          {formatINR(listing.price)}
        </Text>
      </View>
    </NBCard>
  );
}
