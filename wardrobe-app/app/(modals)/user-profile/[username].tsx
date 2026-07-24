import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ChatCircleDots } from 'phosphor-react-native';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { ProfilePostGrid } from '../../../components/profile/ProfilePostGrid';
import { UserListModal } from '../../../components/profile/UserListModal';
import { NBButton } from '../../../components/ui';
import { useUserProfile, useFollowMutation, useUserPosts, FollowListType } from '../../../hooks/useProfile';
import { useCurrentUser } from '../../../hooks/useAuth';
import { colors, radii } from '../../../lib/theme';
import { User } from '../../../types/user';
import { WardrobeItem } from '../../../types/item';

const CREATOR_DATA: Record<string, { user: User; items: WardrobeItem[]; looks: Array<{ title: string; image: string; itemsCount: number }> }> = {
  nova_fits: {
    user: {
      id: 'p1',
      username: 'nova_fits',
      displayName: 'Nova Vance',
      email: 'nova@drip.app',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
      bio: 'Streetwear & Oversized Aesthetics 🖤 | Tokyo & NYC Style',
      followersCount: 4820,
      followingCount: 310,
      wardrobeCount: 8,
      isVerified: true,
      isFollowing: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    items: [
      { id: 'n1', name: 'Oversized Leather Bomber', category: 'outerwear', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600', purchasePrice: 8500, wearCount: 14, brand: 'Oak & Fort', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'n2', name: 'Cargo Parachute Pants', category: 'bottoms', imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=600', purchasePrice: 4200, wearCount: 22, brand: 'Fear of God', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'n3', name: 'Retro High-Top Sneakers', category: 'shoes', imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600', purchasePrice: 6800, wearCount: 19, brand: 'Jordan 1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'n4', name: 'Matte Black Sunglasses', category: 'accessories', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600', purchasePrice: 2100, wearCount: 35, brand: 'Gentle Monster', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    ],
    looks: [
      { title: 'Tokyo Streetwear Vibe', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700', itemsCount: 3 },
      { title: 'Night Drip Aesthetic', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=700', itemsCount: 2 },
    ],
  },
  chloe_styles: {
    user: {
      id: 'p2',
      username: 'chloe_styles',
      displayName: 'Chloe Chen',
      email: 'chloe@drip.app',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600',
      bio: 'Minimalist Pastel & Clean Girl Looks ✨ | Capsule Wardrobe',
      followersCount: 6210,
      followingCount: 180,
      wardrobeCount: 6,
      isVerified: true,
      isFollowing: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    items: [
      { id: 'c1', name: 'Cream Cashmere Knit', category: 'tops', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600', purchasePrice: 5400, wearCount: 18, brand: 'Everlane', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'c2', name: 'High-Waist Trousers', category: 'bottoms', imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600', purchasePrice: 3900, wearCount: 26, brand: 'Arket', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'c3', name: 'Leather Tote Bag', category: 'bags', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600', purchasePrice: 7200, wearCount: 42, brand: 'Polène', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'c4', name: 'Gold Hoop Earrings', category: 'accessories', imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=600', purchasePrice: 1800, wearCount: 50, brand: 'Mejuri', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    ],
    looks: [
      { title: 'Clean Girl Capsule Fit', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=700', itemsCount: 3 },
      { title: 'Minimalist Coffee Run', image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=700', itemsCount: 3 },
    ],
  },
};

type ProfileTab = 'posts' | 'looks' | 'closet';

export default function UserProfileModal() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const me = useCurrentUser();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const { data: serverUser, isLoading } = useUserProfile(username);
  const { data: serverPosts } = useUserPosts(username);
  const followMutation = useFollowMutation(username ?? '');

  const [listType, setListType] = useState<FollowListType | null>(null);

  const creator = username ? CREATOR_DATA[username] : undefined;
  const user = creator?.user || serverUser;
  const isOwnProfile = me?.username === username;

  if (isLoading && !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.black} size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 16, color: colors.black }}>User not found</Text>
      </View>
    );
  }

  const followButton = !isOwnProfile ? (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <NBButton
        label={user.isFollowing ? 'Following' : 'Follow'}
        variant={user.isFollowing ? 'secondary' : 'primary'}
        onPress={() => followMutation.mutate(user.isFollowing ?? false)}
        style={{ flex: 1 }}
      />
      <Pressable
        onPress={() => router.push({ pathname: '/(modals)/messages/[conversationId]', params: { conversationId: user.username } })}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.bentoLavender,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
        }}
      >
        <ChatCircleDots color={colors.bentoPurple} size={18} weight="bold" />
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.bentoPurple }}>
          Message
        </Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ProfileHeader
        user={user}
        onBack={() => router.back()}
        onFollowersPress={() => setListType('followers')}
        onFollowingPress={() => setListType('following')}
        actionSlot={followButton}
      />

      {/* Profile Sub-Tabs Navigation Bar */}
      <View style={{ paddingHorizontal: 14, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: colors.bentoBorder }}>
          {[
            { id: 'posts' as ProfileTab, label: 'Posts' },
            { id: 'looks' as ProfileTab, label: 'Looks' },
            { id: 'closet' as ProfileTab, label: 'Closet Items' },
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
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: isActive ? colors.white : '#6B7280' }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === 'posts' && (
        <ProfilePostGrid posts={serverPosts && serverPosts.length ? serverPosts : []} loading={false} />
      )}

      {activeTab === 'looks' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {creator?.looks.map((look, i) => (
            <View key={i} style={{ backgroundColor: colors.white, borderRadius: radii.bento, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.bentoBorder }}>
              <Image source={{ uri: look.image }} style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: 10 }} contentFit="cover" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>{look.title}</Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>{look.itemsCount} Tagged Closet Items</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'closet' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} showsVerticalScrollIndicator={false}>
          {creator?.items.map((item) => (
            <View key={item.id} style={{ width: '48%', backgroundColor: colors.white, borderRadius: radii.bento, overflow: 'hidden', borderWidth: 1, borderColor: colors.bentoBorder, padding: 10 }}>
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 130, borderRadius: 12, marginBottom: 8 }} contentFit="cover" />
              <Text numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>{item.name}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>{item.brand}</Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.bentoPurple }}>₹{item.purchasePrice}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <UserListModal
        visible={listType !== null}
        username={username ?? ''}
        type={listType ?? 'followers'}
        onClose={() => setListType(null)}
      />
    </View>
  );
}
