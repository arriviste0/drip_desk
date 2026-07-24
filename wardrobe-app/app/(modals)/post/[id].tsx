import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { BookmarkSimple, Camera, ChartPie, ChatCircle, CoatHanger, Cube, Export, Heart, PaperPlaneRight, Sparkle } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { NBAvatar, NBBadge, NBButton, useToast } from '../../../components/ui';
import { ScreenHeader } from '../../../components/profile/ScreenHeader';
import { UserListModal } from '../../../components/profile/UserListModal';
import { Interactive3DMannequin } from '../../../components/feed/Interactive3DMannequin';
import { OutfitFitDiagrams } from '../../../components/feed/OutfitFitDiagrams';
import { useWardrobeStore } from '../../../store/wardrobeStore';
import { colors, radii } from '../../../lib/theme';
import api from '../../../lib/axios';
import { OutfitPost } from '../../../types/post';

const { width: SCREEN_W } = Dimensions.get('window');

interface Comment {
  id: string;
  username: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

type PostViewMode = 'photo' | '3d' | 'diagrams';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToast();
  const addItem = useWardrobeStore((s) => s.addItem);
  const addToWishlist = useWardrobeStore((s) => s.addToWishlist);

  const [viewMode, setViewMode] = useState<PostViewMode>('photo');
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersModalType, setUsersModalType] = useState<'followers' | 'following'>('followers');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', username: 'chloe_styles', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600', text: 'Love this outfit pairing! 😍 The bomber jacket fit is elite.', createdAt: '2h ago' },
    { id: 'c2', username: 'nova_fits', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600', text: 'Where did you get the cargo pants from?? Dope style 🔥', createdAt: '1h ago' },
  ]);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1842);
  const [isSaved, setIsSaved] = useState(false);

  const { data: post } = useQuery({
    queryKey: ['post', id],
    enabled: !!id,
    queryFn: async () => {
      try {
        const { data } = await api.get<OutfitPost>(`/api/posts/${id}`);
        return data;
      } catch {
        return null;
      }
    },
  });

  function handleToggleLike() {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => c + (next ? 1 : -1));
      return next;
    });
    showToast(isLiked ? 'Unliked post' : 'Liked post! ❤️', 'success');
  }

  function handleToggleSave() {
    setIsSaved((prev) => !prev);
    showToast(isSaved ? 'Removed from saved' : 'Saved post to collection! 🔖', 'success');
  }

  function handlePostComment() {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: 'c_' + Date.now(),
      username: 'you',
      text: commentText.trim(),
      createdAt: 'Just now',
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    showToast('Comment posted!', 'success');
  }

  const sampleTags = [
    { id: 't1', name: 'Oversized Vintage Leather Bomber', price: 8500, brand: 'Oak & Fort', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600' },
    { id: 't2', name: 'Cargo Parachute Pants', price: 4200, brand: 'Fear of God', image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=600' },
    { id: 't3', name: 'Retro High-Top Sneakers', price: 6800, brand: 'Jordan 1', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Look Details & Activity" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* User Author Header */}
        <View style={{ backgroundColor: colors.white, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.bentoBorder }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Pressable
              onPress={() => router.push({ pathname: '/(modals)/user-profile/[username]', params: { username: post?.author?.username ?? 'nova_fits' } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <NBAvatar uri={post?.author?.avatar ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600'} size="sm" isVerified={true} />
              <View>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                  {post?.author?.displayName ?? post?.author?.username ?? 'nova_fits'}
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#9CA3AF' }}>
                  Posted 2h ago
                </Text>
              </View>
            </Pressable>

            <View style={{ backgroundColor: colors.bentoLavender, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoPurple }}>
                @nova_fits
              </Text>
            </View>
          </View>

          {/* Media Canvas View */}
          <View style={{ width: SCREEN_W, height: SCREEN_W * 1.1, overflow: 'hidden' }}>
            {viewMode === '3d' ? (
              <Interactive3DMannequin height={SCREEN_W * 1.1} width={SCREEN_W} />
            ) : viewMode === 'diagrams' ? (
              <OutfitFitDiagrams height={SCREEN_W * 1.1} width={SCREEN_W} />
            ) : (
              <Image
                source={{ uri: post?.imageUrl ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700' }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
              />
            )}
          </View>

          {/* Prominent Mid/Bottom 3-Way Mode Switcher Control Bar */}
          <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ flexDirection: 'row', backgroundColor: colors.paper, borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: colors.bentoBorder, gap: 4 }}>
              <Pressable
                onPress={() => setViewMode('photo')}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: viewMode === 'photo' ? colors.black : 'transparent',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Camera color={viewMode === 'photo' ? colors.white : '#6B7280'} size={14} weight="bold" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: viewMode === 'photo' ? colors.white : '#6B7280' }}>
                  Photo
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setViewMode('3d')}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: viewMode === '3d' ? colors.bentoPurple : 'transparent',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Cube color={viewMode === '3d' ? colors.white : '#6B7280'} size={14} weight="bold" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: viewMode === '3d' ? colors.white : '#6B7280' }}>
                  3D Fit
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setViewMode('diagrams')}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: viewMode === 'diagrams' ? '#EC4899' : 'transparent',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <ChartPie color={viewMode === 'diagrams' ? colors.white : '#6B7280'} size={14} weight="bold" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: viewMode === 'diagrams' ? colors.white : '#6B7280' }}>
                  Diagrams
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Action Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 16 }}>
            <Pressable
              onPress={handleToggleLike}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: isLiked ? colors.bentoRose : '#F3F4F6',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 9999,
              }}
            >
              <Heart color={isLiked ? '#EC4899' : colors.black} size={20} weight={isLiked ? 'fill' : 'regular'} />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: isLiked ? '#EC4899' : colors.black }}>
                {likeCount}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {}}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#F3F4F6',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 9999,
              }}
            >
              <ChatCircle color={colors.black} size={20} weight="regular" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                {comments.length}
              </Text>
            </Pressable>

            <Pressable onPress={() => showToast('Post link copied!', 'success')} style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 9999 }}>
              <Export color={colors.black} size={18} weight="regular" />
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable onPress={handleToggleSave} style={{ backgroundColor: isSaved ? colors.bentoYellow : '#F3F4F6', padding: 10, borderRadius: 9999 }}>
              <BookmarkSimple color={isSaved ? '#D97706' : colors.black} size={18} weight={isSaved ? 'fill' : 'regular'} />
            </Pressable>
          </View>

          {/* Instagram-Style "Liked by" and "Saved by" Interactive Pill Rows */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 6 }}>
            <Pressable
              onPress={() => { setUsersModalType('followers'); setShowUsersModal(true); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.bentoRoseSoft,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 9999,
              }}
            >
              <Heart color="#EC4899" size={14} weight="fill" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: colors.black }}>
                Liked by <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>@nova_fits</Text>, <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>@chloe_styles</Text> and <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>1,840 others</Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { setUsersModalType('following'); setShowUsersModal(true); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.bentoLavender,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 9999,
              }}
            >
              <BookmarkSimple color={colors.bentoPurple} size={14} weight="fill" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: colors.black }}>
                Saved by <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>@chloe_styles</Text> and <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>320 others</Text>
              </Text>
            </Pressable>
          </View>

          {/* Caption */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: colors.black, lineHeight: 20 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>{post?.author?.username ?? 'nova_fits'} </Text>
              {post?.caption ?? 'Tokyo Streetwear Energy 🖤 Vintage leather bomber paired with wide parachute cargo pants #streetwear #OOTD'}
            </Text>
          </View>
        </View>

        {/* Shoppable Tagged Items Row */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black, marginBottom: 10 }}>
            Tagged Closet Items ({sampleTags.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, flexDirection: 'row' }}>
            {sampleTags.map((tag) => (
              <View
                key={tag.id}
                style={{
                  width: 200,
                  backgroundColor: colors.white,
                  borderRadius: radii.bento,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                  gap: 8,
                }}
              >
                <Image source={{ uri: tag.image }} style={{ width: '100%', height: 110, borderRadius: 12 }} contentFit="cover" />
                <Text numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>{tag.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>{tag.brand}</Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.bentoPurple }}>₹{tag.price}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  <NBButton
                    label="Move to Closet"
                    variant="primary"
                    style={{ flex: 1, paddingVertical: 6 }}
                    onPress={() => {
                      addItem({
                        id: 'item_' + tag.id + '_' + Date.now(),
                        name: tag.name,
                        category: 'tops',
                        imageUrl: tag.image,
                        purchasePrice: tag.price,
                        brand: tag.brand,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        wearCount: 0,
                      });
                      showToast(`Added ${tag.name} to My Closet! 👕`, 'success');
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Comments Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black, marginBottom: 12 }}>
            Comments ({comments.length})
          </Text>

          <View style={{ gap: 12 }}>
            {comments.map((c) => (
              <View
                key={c.id}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  backgroundColor: colors.white,
                  padding: 12,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                }}
              >
                <NBAvatar uri={c.avatar} size="sm" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                      @{c.username}
                    </Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 10, color: '#9CA3AF' }}>
                      {c.createdAt}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#4B5563', marginTop: 2 }}>
                    {c.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Interactive Comment Input Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.bentoBorder,
          gap: 10,
        }}
      >
        <TextInput
          placeholder="Add a comment..."
          placeholderTextColor="#9CA3AF"
          value={commentText}
          onChangeText={setCommentText}
          style={{
            flex: 1,
            backgroundColor: colors.paper,
            borderRadius: 9999,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontFamily: 'SpaceGrotesk-Medium',
            fontSize: 14,
            color: colors.black,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
          }}
        />
        <Pressable
          onPress={handlePostComment}
          disabled={!commentText.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: commentText.trim() ? colors.black : '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PaperPlaneRight color={colors.white} size={20} weight="bold" />
        </Pressable>
      </View>

      {/* User List Modal for Liked By / Saved By */}
      <UserListModal
        visible={showUsersModal}
        username={post?.author?.username ?? 'nova_fits'}
        type={usersModalType}
        onClose={() => setShowUsersModal(false)}
      />
    </KeyboardAvoidingView>
  );
}
