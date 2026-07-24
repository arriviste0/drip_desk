import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Sparkle, TrendUp, Users } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NBEmptyState, useToast } from '../../components/ui';
import { OutfitPostCard } from '../../components/feed/OutfitPostCard';
import { useFeed } from '../../hooks/useFeed';
import { FeedPost } from '../../types/post';
import { colors, radii } from '../../lib/theme';
import api from '../../lib/axios';
import { useQuery } from '@tanstack/react-query';
import { useWardrobeStore } from '../../store/wardrobeStore';

interface StoryUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

function StoryAvatar({ user }: { user: StoryUser }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(modals)/user-profile/[username]', params: { username: user.username } })}
      style={{ alignItems: 'center', marginHorizontal: 6 }}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          borderWidth: 2,
          borderColor: '#EC4899',
          backgroundColor: colors.white,
          padding: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={{ width: '100%', height: '100%', borderRadius: 26 }}
            contentFit="cover"
            placeholder={{ blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.' }}
            transition={150}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bentoRoseSoft, borderRadius: 26 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: '#EC4899' }}>
              {user.username[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'SpaceGrotesk-Medium',
          fontSize: 10,
          color: colors.black,
          marginTop: 4,
          maxWidth: 60,
        }}
      >
        @{user.username}
      </Text>
    </Pressable>
  );
}

function BentoHeaderSection() {
  const { data: users } = useQuery<StoryUser[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/following');
      return data;
    },
  });

  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16, gap: 12 }}>
      {/* Bento Highlight Box — Blush Pink AI Style Match Hero */}
      <Pressable
        onPress={() => router.push('/(modals)/ai-matcher')}
        style={{
          backgroundColor: colors.bentoBlush,
          borderRadius: radii.bento,
          padding: 18,
          borderWidth: 1,
          borderColor: 'rgba(244, 114, 182, 0.18)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
              }}
            >
              <Sparkle color="#EC4899" size={22} weight="fill" />
            </View>
            <View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>
                AI Style Match
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                Today's curated outfit palette
              </Text>
            </View>
          </View>

          {/* Green Growth Trend Badge */}
          <View style={{ backgroundColor: '#DCFCE7', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TrendUp color={colors.bentoSuccessGreen} size={13} weight="bold" />
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoSuccessGreen }}>
              +15% Vibe
            </Text>
          </View>
        </View>

        {/* Bottom Floating Stats Strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EC4899' }} />
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.black }}>
              98% Match Fit
            </Text>
          </View>

          <View style={{ backgroundColor: colors.white, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#4B5563' }}>
              Pastel Aesthetic
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Stories Bento Carousel */}
      {users && users.length > 0 && (
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radii.bento,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
          }}
        >
          <FlashList
            data={users}
            horizontal
            renderItem={({ item }) => <StoryAvatar user={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const showToast = useToast();
  const addToWishlist = useWardrobeStore((s) => s.addToWishlist);
  const { posts, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching, refetch, isLoading } = useFeed();

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleLike = useCallback((id: string) => {
    api.post('/api/posts/' + id + '/like').catch(() => {});
  }, []);

  const handleSave = useCallback((id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      addToWishlist({
        id: 'saved_' + id + '_' + Date.now(),
        name: `Saved post by @${post.user.username}`,
        category: 'tops',
        imageUrl: post.images[0] ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wearCount: 0,
        isWishlist: true,
      });
    }
    api.post('/api/posts/' + id + '/save').catch(() => {});
    showToast('Saved look to Wishlist!', 'success');
  }, [posts, addToWishlist, showToast]);

  const handleComment = useCallback((id: string) => {
    router.push({ pathname: '/(modals)/post/[id]', params: { id } });
  }, []);

  const handleShare = useCallback((id: string) => {
    api.post('/api/posts/' + id + '/share').catch(() => {});
    showToast('Share link copied to clipboard!', 'success');
  }, [showToast]);

  const handleTagPress = useCallback((tagId: string) => {
    router.push({ pathname: '/(modals)/item-detail/[id]', params: { id: tagId } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <OutfitPostCard
        post={item}
        onLike={handleLike}
        onSave={handleSave}
        onComment={handleComment}
        onShare={handleShare}
        onTagPress={handleTagPress}
      />
    ),
    [handleLike, handleSave, handleComment, handleShare, handleTagPress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Top Bento Header */}
      <View
        style={{
          paddingTop: top + 10,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 22,
            color: colors.black,
            letterSpacing: -0.5,
            flex: 1,
          }}
        >
          Drip Deck
        </Text>
        <View
          style={{
            backgroundColor: colors.bentoBlush,
            paddingVertical: 5,
            paddingHorizontal: 12,
            borderRadius: 9999,
          }}
        >
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 11,
              color: colors.black,
              letterSpacing: 0.5,
            }}
          >
            Feed
          </Text>
        </View>
      </View>

      <FlashList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={<BentoHeaderSection />}
        ListEmptyComponent={
          !isLoading ? (
            <NBEmptyState
              icon={<Users color={colors.bentoPurple} size={36} weight="bold" />}
              title="No posts yet"
              body="Follow creators to see their outfits in your feed"
              cta="Explore Styles"
              onCta={() => router.push('/(tabs)/explore')}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
