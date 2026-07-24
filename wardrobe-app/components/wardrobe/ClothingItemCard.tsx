import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { NBBadge } from '../ui';
import { WardrobeItem } from '../../types/item';
import { colors, radii, shadows } from '../../lib/theme';

interface ClothingItemCardProps {
  item: WardrobeItem;
  onLongPress?: (item: WardrobeItem) => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClothingItemCard({ item, onLongPress }: ClothingItemCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 300 }) }],
  }));

  return (
    <AnimatedPressable
      onPress={() =>
        router.push({ pathname: '/(modals)/item-detail/[id]', params: { id: item.id } })
      }
      onLongPress={() => onLongPress?.(item)}
      onPressIn={() => { scale.value = 0.96; }}
      onPressOut={() => { scale.value = 1; }}
      delayLongPress={300}
      style={[{ flex: 1, margin: 4 }, animStyle]}
    >
      <View style={styles.card}>
        {/* Fixed Uniform Square Image Aspect Ratio */}
        <View style={{ aspectRatio: 1.0, backgroundColor: '#F0EEE8' }}>
          <Image
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={{ blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.' }}
            transition={200}
          />

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={styles.gradient}
          />

          {/* Sale badge */}
          {item.isForSale && (
            <View style={styles.badgeContainer}>
              <NBBadge label="SALE" variant="sale" />
            </View>
          )}

          {/* Overlay text on image */}
          <View style={styles.overlayContent}>
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.wearBadge}>
                <Text style={styles.wearText}>×{item.wearCount}</Text>
              </View>
              {item.brand && (
                <Text numberOfLines={1} style={styles.brandText}>
                  {item.brand}
                </Text>
              )}
              {!item.brand && item.lastWornAt && (
                <Text style={styles.dateText}>
                  {formatDate(item.lastWornAt)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bentoBorder,
    ...shadows.soft,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  overlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  itemName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
    color: colors.white,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wearBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  wearText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  brandText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
    flex: 1,
  },
  dateText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },
});
