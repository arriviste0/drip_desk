import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { ArrowsClockwise } from 'phosphor-react-native';
import { WardrobeItem, ClothingCategory } from '../../types/item';
import { colors } from '../../lib/theme';

type Slot = 'topCenter' | 'bottomCenter' | 'bottomLeft' | 'topRight' | 'topLeft';

const SLOT_ORDER: Slot[] = ['topCenter', 'bottomCenter', 'bottomLeft', 'topRight', 'topLeft'];

const PREFERRED: Record<ClothingCategory, Slot> = {
  tops: 'topCenter',
  dresses: 'topCenter',
  outerwear: 'topLeft',
  bottoms: 'bottomCenter',
  shoes: 'bottomLeft',
  accessories: 'topRight',
  bags: 'topRight',
};

// Position + size of each slot, expressed within the square canvas.
const SLOT_STYLE: Record<Slot, ViewStyle> = {
  topCenter: { top: '5%', left: '27%', width: '46%', height: '42%' },
  bottomCenter: { bottom: '5%', left: '27%', width: '46%', height: '42%' },
  bottomLeft: { bottom: '6%', left: '3%', width: '30%', height: '30%' },
  topRight: { top: '6%', right: '3%', width: '30%', height: '30%' },
  topLeft: { top: '6%', left: '3%', width: '30%', height: '30%' },
};

/** Assign each item to a canvas slot, preferring its category slot, falling back to free slots. */
function allocateSlots(items: WardrobeItem[]): Array<{ item: WardrobeItem; slot: Slot }> {
  const taken = new Set<Slot>();
  const result: Array<{ item: WardrobeItem; slot: Slot }> = [];

  for (const item of items) {
    const preferred = PREFERRED[item.category];
    let slot: Slot | undefined = taken.has(preferred) ? undefined : preferred;
    if (!slot) slot = SLOT_ORDER.find((s) => !taken.has(s));
    if (!slot) break; // canvas full
    taken.add(slot);
    result.push({ item, slot });
  }

  return result;
}

interface CanvasItemProps {
  item: WardrobeItem;
  slot: Slot;
  showSwap: boolean;
  swapping: boolean;
  onSwap?: (item: WardrobeItem) => void;
}

function CanvasItem({ item, slot, showSwap, swapping, onSwap }: CanvasItemProps) {
  const scale = useSharedValue(1);

  // Spring the item in whenever the underlying item changes (mount or swap).
  useEffect(() => {
    scale.value = 0.7;
    scale.value = withSpring(1, { damping: 11, stiffness: 140 });
  }, [item.id]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
        SLOT_STYLE[slot],
        animStyle,
      ]}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        transition={200}
      />

      {showSwap ? (
        <Pressable
          onPress={() => onSwap?.(item)}
          disabled={swapping}
          hitSlop={6}
          style={{
            position: 'absolute',
            bottom: -6,
            right: -6,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.lime,
            borderWidth: 2,
            borderColor: colors.black,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {swapping ? (
            <ActivityIndicator color={colors.black} size="small" />
          ) : (
            <ArrowsClockwise color={colors.black} size={16} weight="bold" />
          )}
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

interface OutfitCanvasProps {
  items: WardrobeItem[];
  showSwap?: boolean;
  swappingId?: string | null;
  onSwap?: (item: WardrobeItem) => void;
  style?: ViewStyle;
}

export function OutfitCanvas({ items, showSwap = false, swappingId, onSwap, style }: OutfitCanvasProps) {
  const placed = allocateSlots(items);

  return (
    <View
      style={[
        {
          aspectRatio: 1,
          width: '100%',
          backgroundColor: colors.white,
          borderWidth: 3,
          borderColor: colors.black,
          borderRadius: 16,
          shadowColor: colors.black,
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
        },
        style,
      ]}
    >
      {placed.map(({ item, slot }) => (
        <CanvasItem
          key={slot}
          item={item}
          slot={slot}
          showSwap={showSwap}
          swapping={swappingId === item.id}
          onSwap={onSwap}
        />
      ))}
    </View>
  );
}
