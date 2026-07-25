import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Gear, BookmarkSimple, ChartPie, Fire, Sparkle, Camera, Rows, Tag } from 'phosphor-react-native';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfilePostGrid } from '../../components/profile/ProfilePostGrid';
import { UserListModal } from '../../components/profile/UserListModal';
import { NBCard, NBEmptyState } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useAuth';
import { FollowListType, useProfileStats, useUserPosts } from '../../hooks/useProfile';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { colors, radii } from '../../lib/theme';
import { OutfitPost } from '../../types/post';

type ProfileTab = 'posts' | 'saved' | 'analytics';

export default function ProfileScreen() {
  const me = useCurrentUser();
  const username = me?.username;
  const wardrobeItems = useWardrobeStore((s) => s.items);
  const localPosts = usePostStore((s) => s.localPosts);

  const { data: stats } = useProfileStats(username);
  const { data: serverPosts, isLoading: postsLoading } = useUserPosts(username);

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [listType, setListType] = useState<FollowListType | null>(null);

  const user = me ? { ...me, wardrobeCount: wardrobeItems.length } : null;

  // Filter local posts created by the currently logged-in user
  const userLocalPosts = localPosts.filter((p) => p.user.username === username);

  // Map local FeedPosts to OutfitPost shape required by ProfilePostGrid
  const mappedLocalPosts: OutfitPost[] = userLocalPosts.map((p) => ({
    id: p.id,
    author: user ?? {
      id: 'me',
      username: p.user.username,
      email: '',
      displayName: p.user.username,
      avatar: p.user.avatarUrl,
      followersCount: 0,
      followingCount: 0,
      wardrobeCount: 0,
      createdAt: p.createdAt,
    },
    imageUrl: p.images[0] ?? '',
    caption: p.caption,
    tags: p.tags,
    hashtags: [],
    likesCount: p.likeCount,
    commentsCount: p.commentCount,
    isLiked: p.isLiked,
    isSaved: p.isSaved,
    createdAt: p.createdAt,
  }));

  // Deduplicate: only show unsaved local posts not yet in server
  const serverPostIds = new Set((serverPosts ?? []).map((p) => p.id));
  const unsyncedLocalPosts = mappedLocalPosts.filter((p) => p.id.startsWith('local-') && !serverPostIds.has(p.id));
  const combinedPosts: OutfitPost[] = [...unsyncedLocalPosts, ...(serverPosts ?? [])];
  const savedPosts = combinedPosts.filter((p) => p.isSaved);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.bentoPurple} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ProfileHeader
        user={user}
        onFollowersPress={() => setListType('followers')}
        onFollowingPress={() => setListType('following')}
        onItemsPress={() => router.push('/(tabs)/wardrobe')}
        topRight={
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={{
              backgroundColor: colors.white,
              borderRadius: 9999,
              padding: 8,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            <Gear color={colors.black} size={20} weight="regular" />
          </Pressable>
        }
      />

      {/* Distinct Profile Sub-Tabs Bar */}
      <View style={{ paddingHorizontal: 14, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: colors.bentoBorder }}>
          {[
            { id: 'posts' as ProfileTab, label: `Posts (${combinedPosts.length})`, icon: Camera },
            { id: 'saved' as ProfileTab, label: `Saved (${savedPosts.length})`, icon: BookmarkSimple },
            { id: 'analytics' as ProfileTab, label: `Style DNA`, icon: ChartPie },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: isActive ? colors.black : 'transparent',
                  flexDirection: 'row',
                  gap: 4,
                }}
              >
                <Icon color={isActive ? colors.white : '#6B7280'} size={14} weight={isActive ? 'bold' : 'regular'} />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: isActive ? colors.white : '#6B7280' }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <ProfilePostGrid
          posts={combinedPosts}
          stats={stats}
          loading={postsLoading && combinedPosts.length === 0}
          emptyTitle="No posts yet"
          emptyBody="Share your first outfit to get started"
        />
      )}

      {/* Saved Inspiration Tab */}
      {activeTab === 'saved' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {savedPosts.length === 0 ? (
            <NBEmptyState
              icon={<BookmarkSimple color={colors.bentoPurple} size={36} weight="bold" />}
              title="No Saved Inspiration"
              body="Bookmark looks from Home or Explore to build your aesthetic moodboard"
              cta="Explore Trends"
              onCta={() => router.push('/(tabs)/explore')}
            />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {savedPosts.map((post) => (
                <Pressable
                  key={post.id}
                  onPress={() => router.push({ pathname: '/(modals)/post/[id]', params: { id: post.id } })}
                  style={{
                    width: '48%',
                    backgroundColor: colors.white,
                    borderRadius: radii.bento,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.bentoBorder,
                  }}
                >
                  <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: 160 }} contentFit="cover" />
                  <View style={{ padding: 10 }}>
                    <Text numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.black }}>
                      @{post.author.username}
                    </Text>
                    <Text numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                      {post.caption || 'Saved Look'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Style DNA & Vibe Analytics Tab */}
      {activeTab === 'analytics' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>
          {/* Aesthetic Style Breakdown */}
          <NBCard style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkle color={colors.bentoPurple} size={18} weight="fill" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                Aesthetic Breakdown
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { label: 'Streetwear / Oversized', pct: 65, color: colors.bentoPurple },
                { label: 'Clean Girl Minimalist', pct: 25, color: '#EC4899' },
                { label: 'Vintage / Thrifted', pct: 10, color: '#D97706' },
              ].map((style) => (
                <View key={style.label} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.black }}>{style.label}</Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: style.color }}>{style.pct}%</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: colors.paper, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${style.pct}%`, height: '100%', backgroundColor: style.color, borderRadius: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          </NBCard>

          {/* Color Palette Chips */}
          <NBCard style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Rows color={colors.black} size={18} weight="bold" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                Signature Color Palette
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {[
                { hex: '#18181B', name: 'Onyx Black', pct: '45%' },
                { hex: '#F5F2EB', name: 'Cream Ivory', pct: '30%' },
                { hex: '#556B2F', name: 'Olive Green', pct: '15%' },
                { hex: '#D97706', name: 'Amber Rust', pct: '10%' },
              ].map((c) => (
                <View key={c.hex} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: '100%', height: 38, borderRadius: 12, backgroundColor: c.hex, borderWidth: 1, borderColor: colors.bentoBorder }} />
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 10, color: colors.black }}>{c.pct}</Text>
                </View>
              ))}
            </View>
          </NBCard>

          {/* Drip Score & CPW Badges */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <NBCard style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Fire color="#EF4444" size={26} weight="fill" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 20, color: colors.black, marginTop: 4 }}>
                92 / 100
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                Drip Index Score 🔥
              </Text>
            </NBCard>

            <NBCard style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Tag color={colors.bentoPurple} size={26} weight="bold" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 20, color: colors.black, marginTop: 4 }}>
                {wardrobeItems.length === 0 ? '₹0' : '₹340'}
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                Avg Cost-Per-Wear
              </Text>
            </NBCard>
          </View>
        </ScrollView>
      )}

      <UserListModal
        visible={listType !== null}
        username={username}
        type={listType ?? 'followers'}
        onClose={() => setListType(null)}
      />
    </View>
  );
}
