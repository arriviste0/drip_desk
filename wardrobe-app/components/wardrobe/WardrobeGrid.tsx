import React, { useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ClothingItemCard } from './ClothingItemCard';
import { FilterState } from './FilterBar';
import { WardrobeItem } from '../../types/item';

interface WardrobeGridProps {
  items: WardrobeItem[];
  filterState?: FilterState;
  onLongPressItem?: (item: WardrobeItem) => void;
}

function applyFilter(items: WardrobeItem[], filter?: FilterState): WardrobeItem[] {
  if (!filter) return items;
  return items.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.colors.length > 0 && !filter.colors.some((c) => item.color?.includes(c))) return false;
    return true;
  });
}

// Split items into two columns for masonry effect
function splitColumns(items: WardrobeItem[]): [WardrobeItem[], WardrobeItem[]] {
  const left: WardrobeItem[] = [];
  const right: WardrobeItem[] = [];

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      left.push(item);
    } else {
      right.push(item);
    }
  });

  return [left, right];
}

function MasonryColumn({
  items,
  onLongPressItem,
}: {
  items: WardrobeItem[];
  onLongPressItem?: (item: WardrobeItem) => void;
}) {
  return (
    <View style={styles.column}>
      {items.map((item) => (
        <ClothingItemCard
          key={item.id}
          item={item}
          onLongPress={onLongPressItem}
        />
      ))}
    </View>
  );
}

export function WardrobeGrid({ items, filterState, onLongPressItem }: WardrobeGridProps) {
  const filtered = applyFilter(items, filterState);
  const [leftItems, rightItems] = useMemo(() => splitColumns(filtered), [filtered]);

  return (
    <FlatList
      data={[1]} // Single item - we render the masonry manually
      keyExtractor={() => 'masonry'}
      renderItem={() => (
        <View style={styles.masonryContainer}>
          <MasonryColumn items={leftItems} onLongPressItem={onLongPressItem} />
          <MasonryColumn items={rightItems} onLongPressItem={onLongPressItem} />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 100,
  },
  masonryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
});
