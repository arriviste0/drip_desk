import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Gear, TShirt, Trash, CoatHanger } from 'phosphor-react-native';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfilePostGrid } from '../../components/profile/ProfilePostGrid';
import { UserListModal } from '../../components/profile/UserListModal';
import { StatsStrip } from '../../components/profile/StatsStrip';
import { NBButton, NBCard, NBEmptyState } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useAuth';
import { FollowListType, useProfileStats, useUserPosts } from '../../hooks/useProfile';
import { SavedOutfit, useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { colors, radii } from '../../lib/theme';
import { OutfitPost } from '../../types/post';

type ProfileTab = 'posts' | 'looks' | 'closet';

function SavedLookCard({ outfit, onDelete }: { outfit: SavedOutfit; onDelete: (id: string) => void }) {
  const itemIdsJson = JSON.stringify(outfit.items.map((i) => i.id));

  return (
    <NBCard style={{ marginBottom: 14, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>
            {outfit.name}
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            {outfit.items.length} Items • Created {new Date(outfit.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Pressable onPress={() => onDelete(outfit.id)} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
          <Trash color="#EF4444" size={16} weight="bold" />
        </Pressable>
      </View>

      {/* Item thumbnails */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {outfit.items.map((item, i) => (
          <View
            key={item.id || i}
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: colors.paper,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 8, color: '#666', textAlign: 'center' }}>
                  {item.name}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <NBButton
          label="Post Look"
          variant="primary"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/(modals)/create-post', params: { outfitId: outfit.id } })}
        />
        <NBButton
          label="Remix"
          variant="secondary"
          onPress={() => router.push({ pathname: '/(modals)/make-outfit', params: { itemIds: itemIdsJson } })}
        />
      </View>
    </NBCard>
  );
}

export default function ProfileScreen() {
  const me = useCurrentUser();
  const username = me?.username;
  const wardrobeItems = useWardrobeStore((s) => s.items);
  const outfits = useWardrobeStore((s) => s.outfits);
  const removeOutfit = useWardrobeStore((s) => s.removeOutfit);
  const localPosts = usePostStore((s) => s.localPosts);

  const { data: stats } = useProfileStats(username);
  const { data: serverPosts, isLoading: postsLoading } = useUserPosts(username);

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [listType, setListType] = useState<FollowListType | null>(null);

  const user = me ? { ...me, wardrobeCount: wardrobeItems.length } : null;

  // Map local FeedPosts to OutfitPost shape required by ProfilePostGrid
  const mappedLocalPosts: OutfitPost[] = localPosts.map((p) => ({
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

  const combinedPosts: OutfitPost[] = [...mappedLocalPosts, ...(serverPosts ?? [])];

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

      <StatsStrip
        stats={{
          posts: combinedPosts.length,
          outfits: Math.max(stats?.outfits ?? 0, outfits.length),
          wardrobeValue: stats?.wardrobeValue ?? 18000,
        }}
      />

      {/* Sub-Tabs Bar */}
      <View style={{ paddingHorizontal: 14, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: colors.bentoBorder }}>
          {[
            { id: 'posts' as ProfileTab, label: `Posts (${combinedPosts.length})` },
            { id: 'looks' as ProfileTab, label: `Looks (${outfits.length})` },
            { id: 'closet' as ProfileTab, label: `Closet Items (${wardrobeItems.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  borderRadius: 9999,
                  backgroundColor: isActive ? colors.black : 'transparent',
                }}
              >
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: isActive ? colors.white : '#6B7280' }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === 'posts' && (
        <ProfilePostGrid
          posts={combinedPosts}
          stats={stats}
          loading={postsLoading && combinedPosts.length === 0}
          emptyTitle="No posts yet"
          emptyBody="Share your first outfit to get started"
        />
      )}

      {activeTab === 'looks' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {outfits.length === 0 ? (
            <NBEmptyState
              icon={<TShirt color="#EC4899" size={36} weight="bold" />}
              title="No Saved Looks"
              body="Build your first outfit combination to see it here"
              cta="Build Look"
              onCta={() => router.push('/(modals)/make-outfit')}
            />
          ) : (
            outfits.map((outfit) => (
              <SavedLookCard key={outfit.id} outfit={outfit} onDelete={removeOutfit} />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'closet' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} showsVerticalScrollIndicator={false}>
          {wardrobeItems.length === 0 ? (
            <View style={{ flex: 1, width: '100%' }}>
              <NBEmptyState
                icon={<CoatHanger color={colors.bentoPurple} size={36} weight="bold" />}
                title="Closet is empty"
                body="Add items to your wardrobe to see them here"
                cta="Add Item"
                onCta={() => router.push('/(modals)/add-item')}
              />
            </View>
          ) : (
            wardrobeItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/(modals)/item-detail/[id]', params: { id: item.id } })}
                style={{ width: '48%', backgroundColor: colors.white, borderRadius: radii.bento, overflow: 'hidden', borderWidth: 1, borderColor: colors.bentoBorder, padding: 10 }}
              >
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 130, borderRadius: 12, marginBottom: 8 }} contentFit="cover" />
                <Text numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>{item.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>{item.brand || item.category}</Text>
                  {item.purchasePrice && <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.bentoPurple }}>₹{item.purchasePrice}</Text>}
                </View>
              </Pressable>
            ))
          )}
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
