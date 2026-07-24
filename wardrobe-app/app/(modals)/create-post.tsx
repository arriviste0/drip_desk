import { useEffect, useState } from 'react';
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
import { Camera, X, CheckCircle, Tag } from 'phosphor-react-native';
import { useAuthStore } from '../../store/authStore';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { usePostStore } from '../../store/postStore';
import { NBButton, useToast } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { colors, radii } from '../../lib/theme';

type Step = 'photo' | 'caption';

export default function CreatePostModal() {
  const { outfitId, itemIds } = useLocalSearchParams<{ outfitId?: string; itemIds?: string }>();
  const me = useAuthStore((s) => s.user);
  const addPost = usePostStore((s) => s.addPost);
  const wardrobeItems = useWardrobeStore((s) => s.items);
  const outfits = useWardrobeStore((s) => s.outfits);
  const showToast = useToast();

  const [step, setStep] = useState<Step>('photo');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [taggedItemIds, setTaggedItemIds] = useState<string[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [posting, setPosting] = useState(false);

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

  async function handlePost() {
    if (!imageUri) {
      showToast('Please pick an outfit photo first', 'info');
      return;
    }
    setPosting(true);

    addPost({
      id: `local-${Date.now()}`,
      user: {
        username: me?.username ?? 'you',
        avatarUrl: me?.avatar,
        isVerified: me?.isVerified ?? false,
      },
      images: [imageUri],
      caption: caption.trim() || undefined,
      tags: [],
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
    });

    showToast('Outfit posted to feed! 🔥', 'success');
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
                  Tag Closet Items ({taggedItems.length})
                </Text>
              </View>
              <Pressable onPress={() => setShowItemPicker((p) => !p)}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.bentoPurple }}>
                  {showItemPicker ? 'Done' : '+ Tag Item'}
                </Text>
              </Pressable>
            </View>

            {taggedItems.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
                {taggedItems.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: colors.bentoLavender,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoPurple }}>
                      {item.name}
                    </Text>
                    <Pressable onPress={() => toggleTag(item.id)} hitSlop={6}>
                      <X color={colors.bentoPurple} size={12} weight="bold" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Closet Picker list */}
            {showItemPicker && (
              <View style={{ marginTop: 12, maxHeight: 180 }}>
                <ScrollView nestedScrollEnabled>
                  {wardrobeItems.map((item) => {
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
                        <Image source={{ uri: item.imageUrl }} style={{ width: 32, height: 32, borderRadius: 8 }} />
                        <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: colors.black, flex: 1 }}>
                          {item.name}
                        </Text>
                        {isTagged && <CheckCircle color={colors.bentoPurple} size={18} weight="fill" />}
                      </Pressable>
                    );
                  })}
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
