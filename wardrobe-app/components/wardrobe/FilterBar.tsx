import React from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { NBChip } from '../ui';
import { ClothingCategory } from '../../types/item';
import { colors, radii } from '../../lib/theme';

export interface FilterState {
  category: ClothingCategory | null;
  colors: string[];
}

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
}

const CATEGORIES: Array<{ label: string; value: ClothingCategory | null }> = [
  { label: 'All', value: null },
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Footwear', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Bags', value: 'bags' },
];

export const COLOR_OPTIONS = [
  { value: 'black', hex: '#0D0D0D' },
  { value: 'white', hex: '#F5F5F5' },
  { value: 'red', hex: '#E53E3E' },
  { value: 'blue', hex: '#3B82F6' },
  { value: 'green', hex: '#10B981' },
  { value: 'yellow', hex: '#FFE000' },
  { value: 'pink', hex: '#FF2D78' },
  { value: 'purple', hex: '#8B5CF6' },
  { value: 'orange', hex: '#F97316' },
  { value: 'brown', hex: '#92400E' },
  { value: 'gray', hex: '#6B7280' },
  { value: 'beige', hex: '#D4B896' },
];

function ColorDot({ hex, selected, onPress }: { hex: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 300 }) }],
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = 0.8;
        setTimeout(() => { scale.value = 1; }, 100);
        onPress();
      }}
    >
      <Animated.View style={[animStyle]}>
        <View
          style={[
            styles.colorDot,
            {
              backgroundColor: hex,
              borderWidth: selected ? 3 : 1.5,
              borderColor: selected ? colors.black : 'rgba(0,0,0,0.12)',
            },
          ]}
        >
          {selected && (
            <View style={styles.colorDotInner} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function FilterBar({ filterState, onFilterChange }: FilterBarProps) {
  function toggleColor(color: string) {
    const next = filterState.colors.includes(color)
      ? filterState.colors.filter((c) => c !== color)
      : [...filterState.colors, color];
    onFilterChange({ ...filterState, colors: next });
  }

  function setCategory(cat: ClothingCategory | null) {
    onFilterChange({ ...filterState, category: cat });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <NBChip
            key={cat.label}
            label={cat.label}
            selected={filterState.category === cat.value}
            onPress={() => setCategory(cat.value)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorScroll}
      >
        {COLOR_OPTIONS.map((color) => (
          <ColorDot
            key={color.value}
            hex={color.hex}
            selected={filterState.colors.includes(color.value)}
            onPress={() => toggleColor(color.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: colors.white,
  },
  categoryScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  colorScroll: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
