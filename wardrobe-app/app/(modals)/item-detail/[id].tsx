import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { CoatHanger, PencilSimple, Trash } from 'phosphor-react-native';
import { useWardrobeStore } from '../../../store/wardrobeStore';
import { useDeleteItem } from '../../../hooks/useWardrobe';
import { NBBadge, NBButton, useToast } from '../../../components/ui';
import { ScreenHeader } from '../../../components/profile/ScreenHeader';
import { colors, radii } from '../../../lib/theme';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useWardrobeStore((s) => s.items);
  const wishlist = useWardrobeStore((s) => s.wishlist);
  const removeItem = useWardrobeStore((s) => s.removeItem);
  const removeFromWishlist = useWardrobeStore((s) => s.removeFromWishlist);
  const moveWishlistToCloset = useWardrobeStore((s) => s.moveWishlistToCloset);
  const showToast = useToast();

  const allItems = [...items, ...wishlist];
  const item = allItems.find((i) => i.id === id);
  const deleteMutation = useDeleteItem();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper }}>
        <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 16, color: colors.black }}>Item not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 12 }}>
          <Text style={{ color: colors.bentoPurple, fontFamily: 'SpaceGrotesk-Bold' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isWishlistItem = item.isWishlist || wishlist.some((w) => w.id === item.id);

  function handleMoveToCloset() {
    moveWishlistToCloset(item!.id);
    showToast('Moved item to My Closet! 👕', 'success');
    router.back();
  }

  function handleDelete() {
    setShowDeleteDialog(true);
  }

  function handleConfirmDelete() {
    setShowDeleteDialog(false);
    removeItem(item!.id);
    removeFromWishlist(item!.id);
    deleteMutation.mutate(item!.id);
    showToast('Item deleted', 'info');
    router.back();
  }

  function handleEdit() {
    router.push(`/(modals)/add-item?id=${item!.id}&isWishlist=${isWishlistItem ? 'true' : 'false'}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScreenHeader
        title="Item Details"
        right={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable hitSlop={12} onPress={handleEdit}>
              <PencilSimple color={colors.black} size={20} weight="bold" />
            </Pressable>
            <Pressable hitSlop={12} onPress={handleDelete}>
              <Trash color="#EF4444" size={20} weight="bold" />
            </Pressable>
          </View>
        }
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', aspectRatio: 1.1, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.bentoBorder }}>
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              {item.brand && (
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                  {item.brand}
                </Text>
              )}
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: colors.black }}>
                {item.name}
              </Text>
            </View>
            {isWishlistItem && (
              <View style={{ backgroundColor: colors.bentoRoseSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: '#EC4899' }}>
                  WISHLIST
                </Text>
              </View>
            )}
          </View>

          {/* Move to Closet Action Banner */}
          {isWishlistItem && (
            <Pressable
              onPress={handleMoveToCloset}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.bentoLavender,
                padding: 16,
                borderRadius: radii.bento,
                borderWidth: 1,
                borderColor: 'rgba(110, 86, 207, 0.2)',
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
                <CoatHanger color={colors.bentoPurple} size={20} weight="bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                  Move to My Closet
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                  Add this item to your active wardrobe items
                </Text>
              </View>
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <NBBadge label={item.category} variant="default" />
            {item.itemType && <NBBadge label={item.itemType} variant="neutral" />}
            {item.size && <NBBadge label={`Size: ${item.size}`} variant="neutral" />}
            {item.purchasePrice && <NBBadge label={`${item.currency || '$'}${item.purchasePrice}`} variant="new" />}
          </View>

          {item.color && item.color.length > 0 && (
            <View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, marginBottom: 8 }}>
                Colors
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {item.color.map((c) => (
                  <NBBadge key={c} label={c} variant="neutral" />
                ))}
              </View>
            </View>
          )}

          {item.material && (
            <View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, marginBottom: 6 }}>
                Material
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: '#4B5563' }}>
                {item.material}
              </Text>
            </View>
          )}

          {item.seasons && item.seasons.length > 0 && (
            <View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, marginBottom: 8 }}>
                Seasons
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {item.seasons.map((s) => (
                  <NBBadge key={s} label={s} variant="neutral" />
                ))}
              </View>
            </View>
          )}

          {item.notes && (
            <View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, marginBottom: 6 }}>
                Notes
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: '#4B5563', lineHeight: 20 }}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bento Delete Confirm Dialog */}
      <Modal visible={showDeleteDialog} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View
            style={{
              backgroundColor: colors.white,
              padding: 24,
              borderRadius: radii.bento,
              gap: 16,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>Delete Item?</Text>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: '#6B7280' }}>This action cannot be undone.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <NBButton
                label="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setShowDeleteDialog(false)}
              />
              <NBButton
                label="Delete"
                variant="danger"
                style={{ flex: 1 }}
                onPress={handleConfirmDelete}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
