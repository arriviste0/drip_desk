import React, { memo, useCallback, useState, useEffect } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { BookmarkSimple, ChatCircle, Export, Heart, Cube, Camera, ChartPie, DotsThreeVertical, PencilSimple, Trash, X, CoatHanger } from 'phosphor-react-native';
import { NBAvatar, NBBadge, NBTag, NBButton, useToast } from '../ui';
import { FeedPost, ShoppableTag } from '../../types/post';
import { colors, radii } from '../../lib/theme';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { WardrobeItem } from '../../types/item';
import { Interactive3DMannequin } from './Interactive3DMannequin';
import { OutfitFitDiagrams } from './OutfitFitDiagrams';
import { PinToBoardModal } from '../modals/PinToBoardModal';

const SCREEN_W = Dimensions.get('window').width;
const CARD_MARGIN = 12;
const CARD_W = SCREEN_W - CARD_MARGIN * 2;

type PostViewMode = 'photo' | '3d' | 'diagrams';

interface OutfitPostCardProps {
  post: FeedPost;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onTagPress: (tagId: string) => void;
}

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return Math.floor(days / 7) + 'w ago';
}

function OutfitPostCardInner({
  post,
  onLike,
  onSave,
  onComment,
  onShare,
  onTagPress,
}: OutfitPostCardProps) {
  const [viewMode, setViewMode] = useState<PostViewMode>('photo');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [imageHeight, setImageHeight] = useState(CARD_W * 1.15);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState(post.caption ?? '');
  const [selectedTag, setSelectedTag] = useState<ShoppableTag | null>(null);

  const editPost = usePostStore((s) => s.editPost);
  const deletePost = usePostStore((s) => s.deletePost);
  const addItem = useWardrobeStore((s) => s.addItem);
  const addToWishlist = useWardrobeStore((s) => s.addToWishlist);
  const showToast = useToast();
  const me = useAuthStore((s) => s.user);
  const isMyPost = Boolean(me && (post.user.username === me.username || post.user.username === me.displayName));

  // Optimistic local state for instant real-time feedback
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);

  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikeCount(post.likeCount ?? 0);
    setIsSaved(post.isSaved ?? false);
    setEditCaptionText(post.caption ?? '');
  }, [post.isLiked, post.likeCount, post.isSaved, post.caption]);

  const handleToggleLike = useCallback(() => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => c + (next ? 1 : -1));
      return next;
    });
    onLike(post.id);
  }, [onLike, post.id]);

  const handleToggleSave = useCallback(() => {
    setIsSaved(true);
    setShowPinModal(true);
    onSave(post.id);
  }, [onSave, post.id]);

  function handleSaveEdit() {
    editPost(post.id, editCaptionText);
    setIsEditing(false);
    setShowMenu(false);
    showToast('Post caption updated! ✏️', 'success');
  }

  function handleDeletePost() {
    deletePost(post.id);
    setShowMenu(false);
    showToast('Post deleted! 🗑️', 'info');
  }

  function handleTagClick(tag: ShoppableTag) {
    setSelectedTag(tag);
    onTagPress(tag.id);
  }

  function handleAddTagToCloset(tag: ShoppableTag) {
    const newItem: WardrobeItem = {
      id: 'item_' + tag.id + '_' + Date.now(),
      name: tag.item?.name ?? 'Tagged Outfit Item',
      category: tag.item?.category ?? 'tops',
      imageUrl: tag.item?.imageUrl ?? post.images[0],
      purchasePrice: tag.item?.purchasePrice ?? 3500,
      brand: tag.item?.brand ?? 'Designer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 0,
    };
    addItem(newItem);
    setSelectedTag(null);
    showToast('Added item to My Closet! 👕', 'success');
  }

  function handleAddTagToWishlist(tag: ShoppableTag) {
    const newItem: WardrobeItem = {
      id: 'wish_' + tag.id + '_' + Date.now(),
      name: tag.item?.name ?? 'Tagged Wishlist Item',
      category: tag.item?.category ?? 'tops',
      imageUrl: tag.item?.imageUrl ?? post.images[0],
      purchasePrice: tag.item?.purchasePrice ?? 3500,
      brand: tag.item?.brand ?? 'Designer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 0,
      isWishlist: true,
    };
    addToWishlist(newItem);
    setSelectedTag(null);
    showToast('Saved item to Wishlist! 💖', 'success');
  }

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const triggerHeartAnim = useCallback(() => {
    'worklet';
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withTiming(1.4, { duration: 200 }),
      withTiming(0, { duration: 400 })
    );
    heartOpacity.value = withDelay(200, withTiming(0, { duration: 400 }));
  }, [heartScale, heartOpacity]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      triggerHeartAnim();
      runOnJS(handleToggleLike)();
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(setShowTags)(!showTags);
    });

  const composed = Gesture.Exclusive(doubleTap, singleTap);

  function handleLayout(e: LayoutChangeEvent) {
    setImageHeight(e.nativeEvent.layout.width * 1.15);
  }

  function handleScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
    setCurrentIndex(idx);
  }

  return (
    <View
      style={{
        marginHorizontal: CARD_MARGIN,
        marginBottom: 16,
        backgroundColor: colors.white,
        borderRadius: radii.bento,
        borderWidth: 1,
        borderColor: colors.bentoBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
        overflow: 'hidden',
      }}
    >
      {/* User row — Clean Bento Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => router.push({ pathname: '/(modals)/user-profile/[username]', params: { username: post.user.username } })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
        >
          <NBAvatar uri={post.user.avatarUrl} size="sm" isVerified={post.user.isVerified} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'SpaceGrotesk-Bold',
                fontSize: 14,
                color: colors.black,
                letterSpacing: -0.2,
              }}
            >
              {post.user.username}
            </Text>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#9CA3AF' }}>
              {getRelativeTime(post.createdAt)}
            </Text>
          </View>
        </Pressable>

        {/* 3-Dots Options Menu */}
        <Pressable onPress={() => setShowMenu(true)} hitSlop={8} style={{ padding: 4 }}>
          <DotsThreeVertical color={colors.black} size={18} weight="bold" />
        </Pressable>
      </View>

      {/* Main Card View Content */}
      <View onLayout={handleLayout} style={{ width: CARD_W, height: imageHeight, overflow: 'hidden' }}>
        {viewMode === '3d' ? (
          <Interactive3DMannequin height={imageHeight} width={CARD_W} tags={post.tags} />
        ) : viewMode === 'diagrams' ? (
          <OutfitFitDiagrams height={imageHeight} width={CARD_W} tags={post.tags} />
        ) : (
          <GestureDetector gesture={composed}>
            <View style={{ width: CARD_W, height: imageHeight }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                style={{ width: CARD_W, height: imageHeight }}
              >
                {post.images.map((uri, i) => (
                  <View key={i} style={{ width: CARD_W, height: imageHeight }}>
                    <Image
                      source={{ uri }}
                      style={{ width: CARD_W, height: imageHeight }}
                      contentFit="cover"
                      placeholder={{ blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.' }}
                      transition={200}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Shoppable tags overlay */}
              {showTags &&
                post.tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={{
                      position: 'absolute',
                      left: tag.x * CARD_W - 7,
                      top: tag.y * imageHeight - 7,
                    }}
                    pointerEvents="box-none"
                  >
                    <NBTag
                      label={tag.item?.name ?? 'Item'}
                      price={tag.item?.purchasePrice}
                      onPress={() => handleTagClick(tag)}
                    />
                    {tag.item?.isForSale ? (
                      <View style={{ position: 'absolute', top: -12, right: -8 }}>
                        <NBBadge label="SALE" variant="sale" />
                      </View>
                    ) : null}
                  </View>
                ))}

              {/* Double-tap heart */}
              <Animated.View
                pointerEvents="none"
                style={[{ position: 'absolute', alignSelf: 'center', top: '38%' }, heartStyle]}
              >
                <Heart color={colors.pink} size={76} weight="fill" />
              </Animated.View>

              {/* Carousel dots */}
              {post.images.length > 1 && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 0,
                    right: 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  pointerEvents="none"
                >
                  {post.images.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === currentIndex ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === currentIndex ? colors.white : 'rgba(255,255,255,0.6)',
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </GestureDetector>
        )}
      </View>

      {/* Prominent Mid/Bottom 3-Way Mode Switcher Control Bar */}
      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
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
              Photo View
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
              3D Fit Model
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

      {/* Action bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingVertical: 10,
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Pressable
          onPress={handleToggleLike}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isLiked ? colors.bentoRose : '#F3F4F6',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 9999,
          }}
        >
          <Heart
            color={isLiked ? '#EC4899' : colors.black}
            size={20}
            weight={isLiked ? 'fill' : 'regular'}
          />
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 12,
              color: isLiked ? '#EC4899' : colors.black,
            }}
          >
            {likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onComment(post.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#F3F4F6',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 9999,
          }}
        >
          <ChatCircle color={colors.black} size={20} weight="regular" />
          {post.commentCount > 0 && (
            <Text
              style={{
                fontFamily: 'SpaceGrotesk-Bold',
                fontSize: 12,
                color: colors.black,
              }}
            >
              {post.commentCount}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => onShare(post.id)}
          style={{
            backgroundColor: '#F3F4F6',
            padding: 8,
            borderRadius: 9999,
          }}
        >
          <Export color={colors.black} size={18} weight="regular" />
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleToggleSave}
          style={{
            backgroundColor: isSaved ? colors.bentoYellow : '#F3F4F6',
            padding: 8,
            borderRadius: 9999,
          }}
        >
          <BookmarkSimple
            color={isSaved ? '#D97706' : colors.black}
            size={18}
            weight={isSaved ? 'fill' : 'regular'}
          />
        </Pressable>
      </View>

      {/* Caption */}
      {post.caption ? (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 14,
          }}
        >
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: colors.black, lineHeight: 19 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold' }}>{post.user.username} </Text>
            <Text style={{ color: '#4B5563' }}>{post.caption}</Text>
          </Text>
        </View>
      ) : null}

      {/* Edit / Delete Post Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable onPress={() => setShowMenu(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 24 }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.white, borderRadius: radii.bento, padding: 20, borderWidth: 1, borderColor: colors.bentoBorder, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
                Post Options
              </Text>
              <Pressable onPress={() => setShowMenu(false)} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
                <X color={colors.black} size={16} weight="bold" />
              </Pressable>
            </View>

            {isEditing ? (
              <View style={{ gap: 12 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>Edit Caption</Text>
                <TextInput
                  value={editCaptionText}
                  onChangeText={setEditCaptionText}
                  multiline
                  style={{
                    fontFamily: 'SpaceGrotesk-Medium',
                    fontSize: 14,
                    color: colors.black,
                    backgroundColor: colors.paper,
                    borderRadius: 14,
                    padding: 12,
                    minHeight: 70,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <NBButton label="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setIsEditing(false)} />
                  <NBButton label="Save Changes" variant="primary" style={{ flex: 1 }} onPress={handleSaveEdit} />
                </View>
              </View>
            ) : isMyPost ? (
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bentoLavender }}
                >
                  <PencilSimple color={colors.bentoPurple} size={20} weight="bold" />
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                    Edit Post Caption
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDeletePost}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bentoRoseSoft }}
                >
                  <Trash color="#EF4444" size={20} weight="bold" />
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: '#EF4444' }}>
                    Delete Post
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={() => { setShowMenu(false); onShare(post.id); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.paper }}
                >
                  <Export color={colors.black} size={20} weight="bold" />
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                    Share Outfit Link
                  </Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Interactive Tagged Closet Item Action Sheet */}
      <Modal visible={selectedTag !== null} transparent animationType="fade" onRequestClose={() => setSelectedTag(null)}>
        <Pressable onPress={() => setSelectedTag(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 24 }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.white, borderRadius: radii.bento, padding: 20, borderWidth: 1, borderColor: colors.bentoBorder, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
                  {selectedTag?.item?.name ?? 'Tagged Closet Item'}
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {selectedTag?.item?.brand ?? 'Designer'} • ₹{selectedTag?.item?.purchasePrice ?? 3500}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedTag(null)} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
                <X color={colors.black} size={16} weight="bold" />
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => selectedTag && handleAddTagToCloset(selectedTag)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bentoMintLight }}
              >
                <CoatHanger color={colors.bentoMint} size={20} weight="bold" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                  Add to My Closet
                </Text>
              </Pressable>

              <Pressable
                onPress={() => selectedTag && handleAddTagToWishlist(selectedTag)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bentoRoseSoft }}
              >
                <Heart color="#EC4899" size={20} weight="fill" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                  Save to Wishlist
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Pin to Board Modal */}
      <PinToBoardModal
        visible={showPinModal}
        itemId={post.id}
        itemImage={post.images[0]}
        itemTitle={post.caption || `Fit by @${post.user.username}`}
        onDismiss={() => setShowPinModal(false)}
      />
    </View>
  );
}

export const OutfitPostCard = memo(OutfitPostCardInner);
