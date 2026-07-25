import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, CheckCircle, Tag, Plus, ShirtFolded } from 'phosphor-react-native';
import { useAuthStore } from '../../store/authStore';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { NBButton, useToast, NBInput } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { colors, radii } from '../../lib/theme';
import api from '../../lib/axios';
import { ShoppableTag } from '../../types/post';
import { WardrobeItem } from '../../types/item';

type Category = 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories';

type Step = 'photo' | 'caption';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'accessories', label: 'Accessories' },
];

export default function CreatePostModal() {
  const { outfitId, itemIds } = useLocalSearchParams<{ outfitId?: string; itemIds?: string }>();
  const me = useAuthStore((s) => s.user);
  const addPost = usePostStore((s) => s.addPost);
  const wardrobeItems = useWardrobeStore((s) => s.items);
  const addItem = useWardrobeStore((s) => s.addItem);
  const outfits = useWardrobeStore((s) => s.outfits);
  const showToast = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('photo');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [taggedItemIds, setTaggedItemIds] = useState<string[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [posting, setPosting] = useState(false);

  // Quick Add Item to Closet state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>('tops');
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    if (outfitId) {
      const outfit = outfits.find((o) => o.id === outfitId);
      if (outfit) {
        setTaggedItemIds(outfit.items.map((i) => i.id));
        const firstImage = outfit.items.find((i) => !!i.imageUrl)?.imageUrl;
        if (firstImage) {
          setImageUri(firstImage);
          setStep('caption');
        }
      }
    } else if (itemIds) {
      try {
        const parsed = JSON.parse(itemIds);
        setTaggedItemIds(parsed);
        const matchingItems = wardrobeItems.filter((i) => parsed.includes(i.id));
        const firstImg = matchingItems.find((i) => !!i.imageUrl)?.imageUrl;
        if (firstImg) {
          setImageUri(firstImg);
          setStep('caption');
        }
      } catch {}
    }
  }, [outfitId, itemIds, outfits, wardrobeItems]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Photo library access is required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setStep('caption');
    }
  }

  function toggleTag(id: string) {
    setTaggedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleQuickAddToCloset() {
    if (!newItemName.trim()) {
      showToast('Please enter an item name', 'error');
      return;
    }

    const createdItem: WardrobeItem = {
      id: `item_${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      imageUrl: imageUri ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700',
      purchasePrice: Number(newItemPrice) || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 0,
    };

    addItem(createdItem);
    setTaggedItemIds((prev) => [...prev, createdItem.id]);
    setNewItemName('');
    setNewItemPrice('');
    setShowQuickAdd(false);
    setShowItemPicker(true);
    showToast(`Added ${createdItem.name} to My Closet & tagged! 👕🏷️`, 'success');
  }

  async function handlePost() {
    if (!imageUri) {
      showToast('Please pick an outfit photo first', 'info');
      return;
    }

    // MANDATORY GARMENT TAGGING VALIDATION
    if (taggedItemIds.length === 0) {
      showToast('Tag at least 1 closet item to share a post! 🏷️', 'error');
      setShowItemPicker(true);
      return;
    }

    setPosting(true);

    const taggedItemsList = wardrobeItems.filter((i) => taggedItemIds.includes(i.id));
    const mappedTags: ShoppableTag[] = taggedItemsList.map((item, index) => ({
      id: `tag-${item.id}-${Date.now()}`,
      itemId: item.id,
      item: item,
      x: 0.3 + (index * 0.25),
      y: 0.4 + (index * 0.2),
    }));

    const postPayload = {
      images: [imageUri],
      caption: caption.trim() || '',
      tags: mappedTags,
    };

    try {
      // Save to server (MongoDB)
      const { data: serverPost } = await api.post('/api/posts', postPayload);

      // Also add to local store for instant UI update
      addPost({
        id: serverPost.id || `local-${Date.now()}`,
        user: {
          username: me?.username ?? 'drip_user',
          avatarUrl: me?.avatar ?? undefined,
          isVerified: me?.isVerified ?? false,
        },
        images: [imageUri],
        caption: caption.trim() || undefined,
        tags: mappedTags,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: serverPost.createdAt || new Date().toISOString(),
      });

      // Invalidate feed + profile caches so data refreshes from DB
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      showToast('Outfit posted to feed! 🔥', 'success');
    } catch (err) {
      // Fallback: save locally even if server fails
      addPost({
        id: `local-${Date.now()}`,
        user: {
          username: me?.username ?? 'drip_user',
          avatarUrl: me?.avatar ?? undefined,
          isVerified: me?.isVerified ?? false,
        },
        images: [imageUri],
        caption: caption.trim() || undefined,
        tags: mappedTags,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: new Date().toISOString(),
      });
      showToast('Posted locally (server unavailable)', 'info');
    }

    setPosting(false);
    router.replace('/(tabs)');
  }

  const taggedItems = wardrobeItems.filter((i) => taggedItemIds.includes(i.id));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={step === 'photo' ? 'Pick Outfit Photo' : 'New Outfit Post'}
        right={
          step === 'caption' ? (
            <Pressable onPress={handlePost} disabled={posting}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.bentoPurple }}>
                Post
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {step === 'photo' ? (
        <Pressable
          onPress={pickImage}
          style={{
            flex: 1,
            margin: 20,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
            borderRadius: radii.bento,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.bentoBlush,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Camera color="#EC4899" size={36} weight="bold" />
          </View>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
            Tap to Pick Outfit Photo
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Select an outfit photo from your gallery
          </Text>
        </Pressable>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {imageUri && (
              <Pressable onPress={pickImage}>
                <View
                  style={{
                    width: 90,
                    height: 110,
                    borderRadius: 18,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.bentoBorder,
                    backgroundColor: colors.white,
                  }}
                >
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Write a caption… #OOTD #style"
                placeholderTextColor="#9CA3AF"
                value={caption}
                onChangeText={setCaption}
                multiline
                style={{
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 14,
                  color: colors.black,
                  minHeight: 80,
                }}
              />
            </View>
          </View>

          {/* Tagged Items Section */}
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Tag color={colors.bentoPurple} size={18} weight="bold" />
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                  Tag Closet Items <Text style={{ color: colors.pink }}>*</Text> ({taggedItems.length})
                </Text>
              </View>
              <Pressable onPress={() => setShowItemPicker((p) => !p)}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.bentoPurple }}>
                  {showItemPicker ? 'Done' : '+ Tag Item'}
                </Text>
              </Pressable>
            </View>

            {taggedItems.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
                {taggedItems.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: colors.bentoLavender,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.bentoPurple }}>
                      {item.name}
                    </Text>
                    <Pressable onPress={() => toggleTag(item.id)} hitSlop={6}>
                      <X color={colors.bentoPurple} size={12} weight="bold" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ backgroundColor: colors.bentoRoseSoft, borderRadius: 12, padding: 10, marginTop: 4 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: '#BE185D' }}>
                  ⚠️ Required: Tag at least 1 item from your closet to publish
                </Text>
              </View>
            )}

            {/* Closet Picker List */}
            {showItemPicker && (
              <View style={{ marginTop: 12 }}>
                {/* Button to Add New Item directly to Closet */}
                <Pressable
                  onPress={() => setShowQuickAdd((p) => !p)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: colors.bentoMintLight,
                    paddingVertical: 10,
                    borderRadius: 9999,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.bentoMint,
                  }}
                >
                  <Plus color={colors.bentoMint} size={16} weight="bold" />
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.bentoMint }}>
                    + Add New Item to Closet
                  </Text>
                </Pressable>

                {/* Inline Quick Add Item Form */}
                {showQuickAdd && (
                  <View style={{ backgroundColor: colors.paper, padding: 14, borderRadius: 16, marginBottom: 12, gap: 10, borderWidth: 1, borderColor: colors.bentoBorder }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                      Quick Add Garment Item
                    </Text>
                    <NBInput
                      placeholder="Item Name (e.g. Oversized Leather Jacket)"
                      value={newItemName}
                      onChangeText={setNewItemName}
                    />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => setNewItemCategory(cat.id)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 9999,
                            backgroundColor: newItemCategory === cat.id ? colors.black : colors.white,
                            borderWidth: 1,
                            borderColor: colors.bentoBorder,
                          }}
                        >
                          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: newItemCategory === cat.id ? colors.white : colors.black }}>
                            {cat.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <NBInput
                      placeholder="Price in ₹ (Optional)"
                      value={newItemPrice}
                      onChangeText={setNewItemPrice}
                      keyboardType="numeric"
                    />
                    <NBButton label="Save to Closet & Tag" variant="primary" onPress={handleQuickAddToCloset} fullWidth />
                  </View>
                )}

                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                  {wardrobeItems.length === 0 ? (
                    <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', textAlign: 'center', marginVertical: 12 }}>
                      No items in closet. Tap "+ Add New Item to Closet" above!
                    </Text>
                  ) : (
                    wardrobeItems.map((item) => {
                      const isTagged = taggedItemIds.includes(item.id);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => toggleTag(item.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            gap: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.bentoBorder,
                          }}
                        >
                          <Image source={{ uri: item.imageUrl }} style={{ width: 34, height: 34, borderRadius: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                              {item.name}
                            </Text>
                            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
                              {item.category}
                            </Text>
                          </View>
                          {isTagged && <CheckCircle color={colors.bentoPurple} size={20} weight="fill" />}
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <NBButton
            label="Share Outfit to Feed"
            variant="primary"
            fullWidth
            loading={posting}
            onPress={handlePost}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
