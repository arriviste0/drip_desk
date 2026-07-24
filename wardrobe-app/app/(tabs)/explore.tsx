import { useState, useMemo, useCallback } from 'react';
import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, MagnifyingGlass, Sparkle, X, User } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../lib/theme';
import { ExplorePinMenu, DiscoverPin } from '../../components/explore/ExplorePinMenu';
import { NBAvatar, useToast } from '../../components/ui';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { WardrobeItem } from '../../types/item';
import { rankPosts } from '../../lib/recommendation';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_W = (SCREEN_W - 3 * 12) / 2;

const INITIAL_DISCOVER_POSTS: DiscoverPin[] = [
  { id: 'd1', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700', username: 'nova_fits', likes: 2410, tags: ['#streetwear', '#OOTD', 'Leather Bomber', 'Oak & Fort'] },
  { id: 'd2', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=700', username: 'chloe_styles', likes: 3120, tags: ['#minimalist', '#neutrals', 'Cashmere Knit', 'Everlane'] },
  { id: 'd3', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=700', username: 'nova_fits', likes: 1840, tags: ['#streetstyle', '#vintage', 'Parachute Pants', 'Fear of God'] },
  { id: 'd4', image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=700', username: 'chloe_styles', likes: 1980, tags: ['#minimalist', '#OOTD', 'High-Waist Trousers', 'Arket'] },
  { id: 'd5', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=700', username: 'nova_fits', likes: 3450, tags: ['#streetwear', '#hypebeast', 'Jordan 1 Sneakers', 'Jordan'] },
  { id: 'd6', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=700', username: 'chloe_styles', likes: 2210, tags: ['#minimalist', '#Y2K', 'Leather Tote', 'Polène'] },
  { id: 'd7', image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=700', username: 'nova_fits', likes: 1540, tags: ['#streetwear', '#OOTD', 'Matte Sunglasses', 'Gentle Monster'] },
  { id: 'd8', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=700', username: 'chloe_styles', likes: 2890, tags: ['#neutrals', '#minimalist', 'Gold Hoops', 'Mejuri'] },
];

const CREATORS_LIST = [
  { username: 'nova_fits', name: 'Nova Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600', style: 'Streetwear' },
  { username: 'chloe_styles', name: 'Chloe Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600', style: 'Minimalist' },
];

const HASHTAGS = [
  { tag: '#OOTD', color: colors.bentoLavender, textColor: colors.bentoPurple },
  { tag: '#streetwear', color: colors.bentoMintLight, textColor: colors.bentoMint },
  { tag: '#minimalist', color: colors.bentoRose, textColor: '#BE185D' },
  { tag: '#hypebeast', color: colors.bentoYellow, textColor: '#B45309' },
  { tag: '#vintage', color: colors.bentoLavender, textColor: colors.bentoPurple },
  { tag: '#Y2K', color: colors.bentoMintLight, textColor: colors.bentoMint },
  { tag: '#grunge', color: colors.bentoRose, textColor: '#BE185D' },
  { tag: '#thriftfit', color: colors.bentoYellow, textColor: '#B45309' },
];

function formatLikes(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

function DiscoverCard({
  post,
  width,
  onPress,
  onLongPress,
}: {
  post: DiscoverPin;
  width: number;
  onPress: (pin: DiscoverPin) => void;
  onLongPress: (pin: DiscoverPin) => void;
}) {
  const heights = [240, 290, 260, 310, 270, 300];
  const h = heights[parseInt(post.id.replace(/[^0-9]/g, '')) || 0 % heights.length] ?? 270;

  return (
    <Pressable
      onPress={() => onPress(post)}
      onLongPress={() => onLongPress(post)}
      delayLongPress={250}
      style={{
        width,
        borderRadius: radii.card,
        backgroundColor: colors.white,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.bentoBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 12,
      }}
    >
      <View style={{ width, height: h }}>
        <Image
          source={{ uri: post.image }}
          style={{ width, height: h }}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.' }}
          transition={200}
        />
        {/* Bottom Pinterest Gradient Info Strip */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 11,
              color: colors.white,
            }}
            numberOfLines={1}
          >
            @{post.username}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Heart color={colors.white} size={12} weight="fill" />
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 10, color: colors.white }}>
              {formatLikes(post.likes)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const { top } = useSafeAreaInsets();
  const showToast = useToast();
  const addItem = useWardrobeStore((s) => s.addItem);
  const addToWishlist = useWardrobeStore((s) => s.addToWishlist);
  const addOutfit = useWardrobeStore((s) => s.addOutfit);
  const localPosts = usePostStore((s) => s.localPosts);

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<DiscoverPin | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Convert local user posts into DiscoverPin items for real-time Explore propagation
  const userDiscoverPins: DiscoverPin[] = useMemo(() => {
    return localPosts.map((p) => ({
      id: p.id,
      image: p.images[0] ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700',
      username: p.user.username,
      likes: p.likeCount,
      tags: p.caption ? [p.caption, '#OOTD'] : ['#OOTD'],
      createdAt: p.createdAt,
    }));
  }, [localPosts]);

  const allPosts = useMemo(() => {
    return [...userDiscoverPins, ...INITIAL_DISCOVER_POSTS];
  }, [userDiscoverPins]);

  const matchingCreators = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().replace('@', '');
    return CREATORS_LIST.filter(
      (c) => c.username.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  const handlePressPin = useCallback((pin: DiscoverPin) => {
    router.push({ pathname: '/(modals)/post/[id]', params: { id: pin.id } });
  }, []);

  const handleLongPressPin = useCallback((pin: DiscoverPin) => {
    setSelectedPin(pin);
    setMenuVisible(true);
  }, []);

  const handleSaveToLooks = useCallback((pin: DiscoverPin) => {
    const mockItem: WardrobeItem = {
      id: 'look_item_' + pin.id + '_' + Date.now(),
      name: `Fit Piece by @${pin.username}`,
      category: 'tops',
      imageUrl: pin.image,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 0,
    };
    addOutfit({
      id: 'look_' + pin.id + '_' + Date.now(),
      name: `Look by @${pin.username}`,
      items: [mockItem],
      createdAt: new Date().toISOString(),
    });
    showToast('Saved to Looks! 🎨', 'success');
  }, [addOutfit, showToast]);

  const handleSaveToCloset = useCallback((pin: DiscoverPin) => {
    const newItem: WardrobeItem = {
      id: 'item_' + pin.id + '_' + Date.now(),
      name: `Item by @${pin.username}`,
      category: 'tops',
      imageUrl: pin.image,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 0,
    };
    addItem(newItem);
    showToast('Added item to My Closet! 👕', 'success');
  }, [addItem, showToast]);

  const handleAddToWishlist = useCallback((pin: DiscoverPin) => {
    const newItem: WardrobeItem = {
      id: 'wish_' + pin.id + '_' + Date.now(),
      name: `Wishlist item by @${pin.username}`,
      category: 'tops',
      imageUrl: pin.image,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 0,
      isWishlist: true,
    };
    addToWishlist(newItem);
    showToast('Saved item to Wishlist! 💖', 'success');
  }, [addToWishlist, showToast]);

  const handleRemixLook = useCallback((pin: DiscoverPin) => {
    router.push({ pathname: '/(modals)/make-outfit' });
  }, []);

  const handleSharePin = useCallback((pin: DiscoverPin) => {
    showToast(`Link to @${pin.username}'s pin copied! 🔗`, 'success');
  }, [showToast]);

  const handleViewDetails = useCallback((pin: DiscoverPin) => {
    router.push({ pathname: '/(modals)/post/[id]', params: { id: pin.id } });
  }, []);

  // Filter & rank posts across multi-entities
  const filtered = useMemo(() => {
    let posts = allPosts;
    if (activeTag) {
      posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()));
    }
    if (query.trim()) {
      const q = query.toLowerCase().replace('@', '');
      posts = posts.filter(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return rankPosts(posts, activeTag);
  }, [allPosts, query, activeTag]);

  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 !== 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Bento Search Header */}
      <View
        style={{
          paddingTop: top + 10,
          paddingBottom: 14,
          paddingHorizontal: 16,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: colors.black, letterSpacing: -0.5, flex: 1 }}>
            Explore
          </Text>
          <View style={{ backgroundColor: colors.bentoLavender, padding: 8, borderRadius: 9999 }}>
            <Sparkle color={colors.bentoPurple} size={18} weight="fill" />
          </View>
        </View>

        {/* Bento Search bar pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            backgroundColor: colors.paper,
            borderRadius: 9999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
          }}
        >
          <MagnifyingGlass color="#6B7280" size={18} weight="bold" />
          <TextInput
            placeholder="Search creators, posts, brands, items…"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: colors.black }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X color="#6B7280" size={16} weight="bold" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Creator Search Results Chips */}
        {matchingCreators.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 10 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: '#6B7280' }}>
              MATCHING CREATORS ({matchingCreators.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, flexDirection: 'row' }}>
              {matchingCreators.map((creator) => (
                <Pressable
                  key={creator.username}
                  onPress={() => router.push({ pathname: '/(modals)/user-profile/[username]', params: { username: creator.username } })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: colors.white,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: colors.bentoBorder,
                  }}
                >
                  <NBAvatar uri={creator.avatar} size="sm" />
                  <View>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                      @{creator.username}
                    </Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 10, color: '#6B7280' }}>
                      {creator.style} Creator
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending Bento Hashtags */}
        <View style={{ backgroundColor: colors.white, paddingVertical: 12, marginTop: 10, borderBottomWidth: 1, borderBottomColor: colors.bentoBorder }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, flexDirection: 'row' }}
          >
            <Pressable
              onPress={() => setActiveTag(null)}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 9999,
                backgroundColor: activeTag === null ? colors.black : colors.paper,
              }}
            >
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 12,
                  color: activeTag === null ? colors.white : colors.black,
                }}
              >
                All Trends
              </Text>
            </Pressable>
            {HASHTAGS.map((h) => {
              const isActive = activeTag === h.tag;
              return (
                <Pressable
                  key={h.tag}
                  onPress={() => setActiveTag(isActive ? null : h.tag)}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 9999,
                    backgroundColor: isActive ? colors.black : h.color,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'SpaceGrotesk-Bold',
                      fontSize: 12,
                      color: isActive ? colors.white : h.textColor,
                    }}
                  >
                    {h.tag}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Section title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 10,
          }}
        >
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black, flex: 1 }}>
            {activeTag ? activeTag : query ? `Search Results (${filtered.length})` : 'Recommended Trends'}
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#9CA3AF' }}>
            Hold for options
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>No Results Found</Text>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>
              Try searching for creators, brands, or styles
            </Text>
          </View>
        ) : (
          /* Pinterest Masonry 2-col grid */
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 10, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              {leftCol.map((post) => (
                <DiscoverCard key={post.id} post={post} width={COL_W} onPress={handlePressPin} onLongPress={handleLongPressPin} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {rightCol.map((post) => (
                <DiscoverCard key={post.id} post={post} width={COL_W} onPress={handlePressPin} onLongPress={handleLongPressPin} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Long-Press Action Menu Overlay for Explore Pins */}
      <ExplorePinMenu
        pin={selectedPin}
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        onSaveToLooks={handleSaveToLooks}
        onSaveToCloset={handleSaveToCloset}
        onAddToWishlist={handleAddToWishlist}
        onRemixLook={handleRemixLook}
        onSharePin={handleSharePin}
        onViewDetails={handleViewDetails}
      />
    </View>
  );
}
