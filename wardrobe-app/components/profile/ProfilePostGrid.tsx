import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { ImageSquare } from 'phosphor-react-native';
import { NBEmptyState } from '../ui';
import { StatsStrip } from './StatsStrip';
import { ProfileStats } from '../../hooks/useProfile';
import { OutfitPost } from '../../types/post';
import { colors } from '../../lib/theme';

interface ProfilePostGridProps {
  posts: OutfitPost[];
  stats?: ProfileStats;
  loading?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}

function PostThumb({ post }: { post: OutfitPost }) {
  return (
    <View style={{ flex: 1, aspectRatio: 1, padding: 4 }}>
      <Pressable
        onPress={() => router.push(`/(modals)/post/${post.id}`)}
        style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
        />
      </Pressable>
    </View>
  );
}

export function ProfilePostGrid({
  posts,
  stats,
  loading,
  emptyTitle = 'No posts yet',
  emptyBody = 'Outfit posts will show up here',
}: ProfilePostGridProps) {
  const renderItem = useCallback(
    ({ item }: { item: OutfitPost }) => <PostThumb post={item} />,
    []
  );

  return (
    <FlashList
      data={posts}
      numColumns={3}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<StatsStrip stats={stats} />}
      ListEmptyComponent={
        !loading ? (
          <NBEmptyState
            icon={<ImageSquare color={colors.bentoPurple} size={36} weight="bold" />}
            title={emptyTitle}
            body={emptyBody}
          />
        ) : null
      }
      contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
