import { useState, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Sparkle, TrendUp, Users } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NBEmptyState, useToast } from '../../components/ui';
import { OutfitPostCard } from '../../components/feed/OutfitPostCard';
import { StoryViewerModal } from '../../components/feed/StoryViewerModal';
import { useFeed } from '../../hooks/useFeed';
import { FeedPost } from '../../types/post';
import { colors, radii } from '../../lib/theme';
import api from '../../lib/axios';
import { useQuery } from '@tanstack/react-query';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { rankPosts } from '../../lib/recommendation';
import { useFollowStore } from '../../store/followStore';

interface StoryUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

function StoryAvatar({ user, onPress }: { user: StoryUser; onPress: (user: StoryUser) => void }) {
  return (
    <Pressable
      onPress={() => onPress(user)}
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
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 10,
          color: colors.black,
          marginTop: 4,
        }}
      >
        @{user.username.length > 8 ? user.username.slice(0, 8) + '…' : user.username}
      </Text>
    </Pressable>
  );
}

function HomeHeader({ onStoryPress }: { onStoryPress: (user: StoryUser) => void }) {
  const { data: users } = useQuery<StoryUser[]>({
    queryKey: ['story-users'],
    queryFn: async () => {
      try {
        const { data } = await api.get<StoryUser[]>('/api/users/trending');
        return data;
      } catch {
        return [];
      }
    },
  });

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 16, gap: 14 }}>
      {/* Hero Bento AI Style Match Banner */}
      <Pressable
        onPress={() => router.push('/(modals)/ai-matcher')}
        style={{
          backgroundColor: colors.bentoBlush,
          borderRadius: radii.bento,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
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
            renderItem={({ item }) => <StoryAvatar user={item} onPress={onStoryPress} />}
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
  const localPosts = usePostStore((s) => s.localPosts);
  const followingUsernames = useFollowStore((s) => s.followingUsernames);
  const [selectedStoryUser, setSelectedStoryUser] = useState<StoryUser | null>(null);

  const { posts: serverPosts, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching, refetch } = useFeed();

  // Combine server posts + any unsaved local posts (deduped) and rank
  const rankedFeedPosts = useMemo(() => {
    // Only include local posts that haven't been synced to server yet (still have 'local-' prefix)
    const serverIds = new Set((serverPosts ?? []).map((p) => p.id));
    const unsynced = localPosts.filter((p) => p.id.startsWith('local-') && !serverIds.has(p.id));
    const combined = [...unsynced, ...(serverPosts ?? [])];
    return rankPosts(combined, { followedUsernames: followingUsernames });
  }, [localPosts, serverPosts, followingUsernames]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleLike = useCallback((id: string) => {
    api.post('/api/posts/' + id + '/like').catch(() => {});
  }, []);

  const handleSave = useCallback((id: string) => {
    const post = rankedFeedPosts.find((p) => p.id === id);
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
  }, [rankedFeedPosts, addToWishlist, showToast]);

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
      {/* Bento Top Header */}
      <View
        style={{
          paddingTop: top + 10,
          paddingBottom: 14,
          paddingHorizontal: 16,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: colors.black, letterSpacing: -0.6 }}>
          DripDeck
        </Text>

        <Pressable
          onPress={() => router.push('/(modals)/create-post')}
          style={{
            backgroundColor: colors.black,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 9999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkle color={colors.white} size={14} weight="bold" />
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.white }}>
            + Post Look
          </Text>
        </Pressable>
      </View>

      <FlashList
        data={rankedFeedPosts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => <HomeHeader onStoryPress={(user) => setSelectedStoryUser(user)} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <NBEmptyState
              icon={<Users color={colors.bentoPurple} size={36} weight="bold" />}
              title="Your feed is quiet"
              body="Post an outfit or follow creators to populate your feed"
              cta="+ Post Outfit"
              onCta={() => router.push('/(modals)/create-post')}
            />
          </View>
        }
      />

      {/* Full Screen Instagram-style Story Viewer */}
      <StoryViewerModal
        user={selectedStoryUser}
        visible={!!selectedStoryUser}
        onDismiss={() => setSelectedStoryUser(null)}
      />
    </View>
  );
}
