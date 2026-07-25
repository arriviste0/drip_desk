import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CoatHanger, Heart, Sparkle, TShirt, Trash, Plus, Eye, X, ArrowRight } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NBEmptyState, NBCard, NBButton, useToast } from '../../components/ui';
import { FilterBar, FilterState } from '../../components/wardrobe/FilterBar';
import { WardrobeGrid } from '../../components/wardrobe/WardrobeGrid';
import { PinActionMenu } from '../../components/wardrobe/PinActionMenu';
import { useWardrobe, useWishlist, useDeleteItem } from '../../hooks/useWardrobe';
import { SavedOutfit, useWardrobeStore } from '../../store/wardrobeStore';
import { WardrobeItem } from '../../types/item';
import { colors, radii } from '../../lib/theme';

type SubTab = 'closet' | 'outfits' | 'wishlist';

function formatINR(value: number): string {
  const digits = Math.round(value).toString();
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return '₹' + grouped;
}

function SubTabsHeader({
  itemCount,
  outfitCount,
  wishlistCount,
  activeTab,
  onTabChange,
  totalValue,
}: {
  itemCount: number;
  outfitCount: number;
  wishlistCount: number;
  activeTab: SubTab;
  onTabChange: (tab: SubTab) => void;
  totalValue: number;
}) {
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, gap: 8 }}>
      {/* Pill-shaped Sub-Tabs directly under header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
          Wardrobe Library
        </Text>
        <View style={{ backgroundColor: colors.bentoMintLight, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoMint }}>
            Closet Value: {formatINR(totalValue)}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.white,
          borderRadius: 9999,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
        }}
      >
        {[
          { id: 'closet' as SubTab, label: `My Closet (${itemCount})` },
          { id: 'outfits' as SubTab, label: `Looks (${outfitCount})` },
          { id: 'wishlist' as SubTab, label: `Wishlist (${wishlistCount})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                flexDirection: 'row',
                gap: 4,
                backgroundColor: isActive ? colors.black : 'transparent',
              }}
            >
              {tab.id === 'wishlist' && (
                <Heart
                  color={isActive ? colors.white : '#6B7280'}
                  size={13}
                  weight={isActive ? 'fill' : 'regular'}
                />
              )}
              {tab.id === 'outfits' && (
                <TShirt
                  color={isActive ? colors.white : '#6B7280'}
                  size={13}
                  weight={isActive ? 'fill' : 'regular'}
                />
              )}
              {tab.id === 'closet' && (
                <CoatHanger
                  color={isActive ? colors.white : '#6B7280'}
                  size={13}
                  weight="regular"
                />
              )}
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 11,
                  color: isActive ? colors.white : '#6B7280',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LookItemModal({
  item,
  visible,
  onDismiss,
  onMoveToCloset,
  onSaveToWishlist,
}: {
  item: WardrobeItem | null;
  visible: boolean;
  onDismiss: () => void;
  onMoveToCloset: (item: WardrobeItem) => void;
  onSaveToWishlist: (item: WardrobeItem) => void;
}) {
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 24 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.white, borderRadius: radii.bento, padding: 20, borderWidth: 1, borderColor: colors.bentoBorder, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>
              Look Item Options
            </Text>
            <Pressable onPress={onDismiss} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
              <X color={colors.black} size={16} weight="bold" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.paper }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: 50, height: 50, borderRadius: 12 }} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>{item.name}</Text>
              {item.brand && <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280', marginTop: 1 }}>{item.brand}</Text>}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => { onMoveToCloset(item); onDismiss(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bentoMintLight }}
            >
              <CoatHanger color={colors.bentoMint} size={20} weight="bold" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                Move Item to My Closet
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { onSaveToWishlist(item); onDismiss(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bentoRoseSoft }}
            >
              <Heart color="#EC4899" size={20} weight="fill" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                Save Item to Wishlist
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { onDismiss(); router.push({ pathname: '/(modals)/item-detail/[id]', params: { id: item.id } }); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.paper }}
            >
              <Eye color={colors.black} size={20} weight="bold" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                View Full Item Details
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SavedLookCard({
  outfit,
  onDelete,
  onItemPress,
}: {
  outfit: SavedOutfit;
  onDelete: (id: string) => void;
  onItemPress: (item: WardrobeItem) => void;
}) {
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

      {/* Item thumbnails row — clickable for options */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {outfit.items.map((item, i) => (
          <Pressable
            key={item.id || i}
            onPress={() => onItemPress(item)}
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
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
          </Pressable>
        ))}
      </View>

      {/* Look Card Action Buttons */}
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

export default function WardrobeScreen() {
  const { top } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SubTab>('closet');
  const [filterState, setFilterState] = useState<FilterState>({ category: null, colors: [] });

  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [lookItemModalVisible, setLookItemModalVisible] = useState(false);
  const [selectedLookItem, setSelectedLookItem] = useState<WardrobeItem | null>(null);

  const { isLoading: closetLoading } = useWardrobe();
  const { isLoading: wishlistLoading } = useWishlist();

  const items = useWardrobeStore((s) => s.items);
  const wishlist = useWardrobeStore((s) => s.wishlist);
  const outfits = useWardrobeStore((s) => s.outfits);
  const removeOutfit = useWardrobeStore((s) => s.removeOutfit);
  const addItem = useWardrobeStore((s) => s.addItem);
  const addToWishlist = useWardrobeStore((s) => s.addToWishlist);
  const removeItem = useWardrobeStore((s) => s.removeItem);
  const removeFromWishlist = useWardrobeStore((s) => s.removeFromWishlist);
  const moveWishlistToCloset = useWardrobeStore((s) => s.moveWishlistToCloset);
  const deleteMutation = useDeleteItem();
  const showToast = useToast();

  const handleLongPress = useCallback((item: WardrobeItem) => {
    setSelectedItem(item);
    setMenuVisible(true);
  }, []);

  const handleDismissMenu = useCallback(() => {
    setMenuVisible(false);
    setSelectedItem(null);
  }, []);

  const handleLookItemClick = useCallback((item: WardrobeItem) => {
    setSelectedLookItem(item);
    setLookItemModalVisible(true);
  }, []);

  const handleMoveLookItemToCloset = useCallback((item: WardrobeItem) => {
    addItem({ ...item, isWishlist: false });
    showToast(`Added ${item.name} to My Closet! 👕`, 'success');
  }, [addItem, showToast]);

  const handleSaveLookItemToWishlist = useCallback((item: WardrobeItem) => {
    addToWishlist({ ...item, isWishlist: true });
    showToast(`Saved ${item.name} to Wishlist! 💖`, 'success');
  }, [addToWishlist, showToast]);

  const handleAction = useCallback((action: string, item: WardrobeItem) => {
    switch (action) {
      case 'move_to_closet':
        moveWishlistToCloset(item.id);
        showToast('Moved item to My Closet! 👕', 'success');
        break;
      case 'outfit':
        router.push({ pathname: '/(modals)/make-outfit' });
        break;
      case 'wear':
        break;
      case 'sell':
        router.push({ pathname: '/(modals)/item-detail/[id]', params: { id: item.id } });
        break;
      case 'share':
        showToast('Link to item copied!', 'success');
        break;
      case 'delete':
        removeItem(item.id);
        removeFromWishlist(item.id);
        deleteMutation.mutate(item.id);
        showToast('Item deleted from Closet', 'info');
        break;
    }
  }, [moveWishlistToCloset, removeItem, removeFromWishlist, deleteMutation, showToast]);

  const closetValue = items.reduce((sum, item) => sum + (Number(item.purchasePrice) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Clean Bento Header */}
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
          My Wardrobe
        </Text>
        <Pressable
          onPress={() => router.push('/(modals)/add-item')}
          style={{
            backgroundColor: colors.bentoBlush,
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: 'rgba(244, 114, 182, 0.2)',
          }}
        >
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 12,
              color: colors.black,
            }}
          >
            + Add Item
          </Text>
        </Pressable>
      </View>

      {/* Clean Sub-Tabs Header directly under main top bar */}
      <SubTabsHeader
        itemCount={items.length}
        outfitCount={outfits.length}
        wishlistCount={wishlist.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalValue={closetValue}
      />

      {activeTab === 'closet' && (
        <>
          <FilterBar filterState={filterState} onFilterChange={setFilterState} />
          {!closetLoading && items.length === 0 ? (
            <NBEmptyState
              icon={<CoatHanger color={colors.bentoPurple} size={36} weight="bold" />}
              title="Closet is empty"
              body="Add your first item to start building your wardrobe"
              cta="Add Item"
              onCta={() => router.push('/(modals)/add-item')}
            />
          ) : (
            <WardrobeGrid
              items={items}
              filterState={filterState}
              onLongPressItem={handleLongPress}
            />
          )}
        </>
      )}

      {activeTab === 'outfits' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Bento Action Bar: Build Look or AI Style Match */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <Pressable
              onPress={() => router.push('/(modals)/make-outfit')}
              style={{
                flex: 1,
                backgroundColor: colors.bentoLavender,
                borderRadius: radii.bento,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: 'rgba(110, 86, 207, 0.2)',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
                <Plus color={colors.bentoPurple} size={20} weight="bold" />
              </View>
              <View>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                  Build Look
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                  Combine items
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(modals)/ai-matcher')}
              style={{
                flex: 1,
                backgroundColor: colors.bentoBlush,
                borderRadius: radii.bento,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: 'rgba(244, 114, 182, 0.2)',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
                <Sparkle color="#EC4899" size={20} weight="fill" />
              </View>
              <View>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                  AI Matcher
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                  Stylist match
                </Text>
              </View>
            </Pressable>
          </View>

          {outfits.length === 0 ? (
            <NBEmptyState
              icon={<TShirt color="#EC4899" size={36} weight="bold" />}
              title="No Saved Looks"
              body="Build your first look combination or use AI Style Matcher"
              cta="Build Look"
              onCta={() => router.push('/(modals)/make-outfit')}
            />
          ) : (
            outfits.map((outfit) => (
              <SavedLookCard key={outfit.id} outfit={outfit} onDelete={removeOutfit} onItemPress={handleLookItemClick} />
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'wishlist' && (
        !wishlistLoading && wishlist.length === 0 ? (
          <NBEmptyState
            icon={<Heart color="#EC4899" size={36} weight="bold" />}
            title="Wishlist empty"
            body="Save items you love to your wishlist"
          />
        ) : (
          <WardrobeGrid items={wishlist} onLongPressItem={handleLongPress} />
        )
      )}

      {/* Pin Action Menu Overlay */}
      <PinActionMenu
        item={selectedItem}
        visible={menuVisible}
        onDismiss={handleDismissMenu}
        onAction={handleAction}
      />

      {/* Look Item Options Action Sheet Modal */}
      <LookItemModal
        item={selectedLookItem}
        visible={lookItemModalVisible}
        onDismiss={() => { setLookItemModalVisible(false); setSelectedLookItem(null); }}
        onMoveToCloset={handleMoveLookItemToCloset}
        onSaveToWishlist={handleSaveLookItemToWishlist}
      />
    </View>
  );
}
