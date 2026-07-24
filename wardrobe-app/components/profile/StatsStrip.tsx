import React from 'react';
import { Text, View } from 'react-native';
import { ProfileStats } from '../../hooks/useProfile';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { colors, radii } from '../../lib/theme';

interface StatsStripProps {
  stats?: ProfileStats;
}

export function formatINR(value: number): string {
  const digits = Math.round(value).toString();
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return '₹' + grouped;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Medium',
          fontSize: 11,
          color: '#6B7280',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatsStrip({ stats }: StatsStripProps) {
  const items = useWardrobeStore((s) => s.items);
  const outfits = useWardrobeStore((s) => s.outfits);
  const localPosts = usePostStore((s) => s.localPosts);

  // Compute live closet value from items array
  const calculatedClosetValue = items.reduce(
    (sum, item) => sum + (Number(item.purchasePrice) || 0),
    0
  );

  const displayPosts = (stats?.posts ?? 0) + localPosts.length;
  const displayOutfits = Math.max(stats?.outfits ?? 0, outfits.length);
  const displayValue = Math.max(stats?.wardrobeValue ?? 0, calculatedClosetValue);

  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 14,
        marginTop: 8,
        marginBottom: 16,
        paddingVertical: 14,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.bentoBorder,
        borderRadius: radii.bento,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <Stat value={String(displayPosts)} label="Posts" />
      <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
      <Stat value={String(displayOutfits)} label="Outfits" />
      <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
      <Stat value={formatINR(displayValue)} label="Closet Value" />
    </View>
  );
}
