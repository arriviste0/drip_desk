import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { NBButton, NBBadge, NBChip, NBInput, NBCard } from '../../components/ui';
import { useToast } from '../../components/ui';
import { colors } from '../../lib/theme';
import api from '../../lib/axios';
import { ClothingCategory } from '../../types/item';

type Step = 1 | 2 | 3;
type AddMethod = 'photo' | 'manual' | 'link';

interface ItemForm {
  name: string;
  category: ClothingCategory | null;
  itemType: string;
  primaryColor: string;
  secondaryColor: string;
  size: string;
  material: string;
  pattern: string;
  seasons: string[];
  occasions: string[];
  purchasePrice: string;
  currency: string;
  brand: string;
  notes: string;
  productUrl: string;
}

const DEFAULT_FORM: ItemForm = {
  name: '',
  category: null,
  itemType: '',
  primaryColor: '',
  secondaryColor: '',
  size: '',
  material: '',
  pattern: '',
  seasons: [],
  occasions: [],
  purchasePrice: '',
  currency: 'USD',
  brand: '',
  notes: '',
  productUrl: '',
};

const CATEGORIES: Array<{ label: string; value: ClothingCategory }> = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Footwear', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Bags', value: 'bags' },
];

const PATTERNS = ['Solid', 'Striped', 'Floral', 'Graphic', 'Plaid', 'Polka Dot'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS = ['Casual', 'Work', 'Formal', 'Party', 'Sport', 'Date', 'Travel'];

function normalizeCategory(value: unknown): ClothingCategory | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, ClothingCategory> = {
    top: 'tops',
    tops: 'tops',
    shirt: 'tops',
    bottom: 'bottoms',
    bottoms: 'bottoms',
    pants: 'bottoms',
    dress: 'dresses',
    dresses: 'dresses',
    outerwear: 'outerwear',
    jacket: 'outerwear',
    shoe: 'shoes',
    shoes: 'shoes',
    footwear: 'shoes',
    accessory: 'accessories',
    accessories: 'accessories',
    bag: 'bags',
    bags: 'bags',
  };
  return aliases[normalized] ?? null;
}

function asString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function Checkerboard() {
  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {Array.from({ length: 8 }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', flex: 1 }}>
          {Array.from({ length: 8 }).map((_, c) => (
            <View
              key={c}
              style={{
                flex: 1,
                backgroundColor: (r + c) % 2 === 0 ? '#E5E5E5' : '#FFFFFF',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function StepDots({ step }: { step: Step }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 14 }}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: s <= step ? colors.yellow : colors.white,
            borderWidth: 2,
            borderColor: colors.black,
          }}
        />
      ))}
    </View>
  );
}

export default function AddItemModal() {
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<AddMethod | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [imageLink, setImageLink] = useState('');
  const [productLink, setProductLink] = useState('');
  const [removing, setRemoving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingLink, setFetchingLink] = useState(false);
  const [form, setForm] = useState<ItemForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const showToast = useToast();
  const queryClient = useQueryClient();
  const { isWishlist, id } = useLocalSearchParams();
  const items = useWardrobeStore((s) => s.items);
  const wishlist = useWardrobeStore((s) => s.wishlist);
  const allItems = [...items, ...wishlist];
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    if (id) {
      const item = allItems.find((i) => i.id === id);
      if (item) {
        setForm({
          name: item.name || '',
          category: item.category as ClothingCategory || null,
          itemType: item.itemType || '',
          primaryColor: item.primaryColor || '',
          secondaryColor: item.secondaryColor || '',
          size: item.size || '',
          material: item.material || '',
          pattern: item.pattern || '',
          seasons: item.seasons || [],
          occasions: item.occasions || [],
          purchasePrice: item.purchasePrice ? String(item.purchasePrice) : '',
          currency: item.currency || 'USD',
          brand: item.brand || '',
          notes: item.notes || '',
          productUrl: item.productUrl || '',
        });
        setImageUri(item.imageUrl || null);
        setProcessedUri(item.imageUrl || null);
        setStep(2);
      }
    }
  }, [id, allItems]);

  function applyDetectedData(payload: any) {
    const data = payload?.item ?? payload?.data ?? payload ?? {};
    const rawColors = Array.isArray(data.colors)
      ? data.colors
      : Array.isArray(data.color)
        ? data.color
        : [data.primaryColor ?? data.color, data.secondaryColor].filter(Boolean);

    setForm((previous) => ({
      ...previous,
      name: asString(data.name || data.title) || previous.name,
      category: normalizeCategory(data.category) || previous.category,
      itemType: asString(data.itemType || data.type || data.subcategory) || previous.itemType,
      brand: asString(data.brand) || previous.brand,
      primaryColor: asString(rawColors[0]) || previous.primaryColor,
      secondaryColor: asString(rawColors[1]) || previous.secondaryColor,
      pattern: asString(data.pattern) || previous.pattern,
      material: asString(data.material) || previous.material,
      size: asString(data.size) || previous.size,
      occasions: Array.isArray(data.occasions) ? data.occasions.map(asString).filter(Boolean) : previous.occasions,
      seasons: Array.isArray(data.seasons) ? data.seasons.map(asString).filter(Boolean) : previous.seasons,
      purchasePrice: asString(data.purchasePrice ?? data.price) || previous.purchasePrice,
      currency: asString(data.currency) || previous.currency,
      notes: asString(data.notes || data.description) || previous.notes,
      productUrl: asString(data.productUrl || data.url) || previous.productUrl,
    }));

    const detectedImage = asString(data.imageUrl || data.image);
    if (detectedImage) {
      setImageUri(detectedImage);
      setProcessedUri(detectedImage);
    }
  }

  async function processImage(uri: string) {
    setImageUri(uri);
    setProcessedUri(null);
    setRemoving(true);
    setAnalyzing(true);
    showToast('Cleaning up background…', 'info');
    try {
      const formData = new FormData();
      formData.append('image', { uri, type: 'image/jpeg', name: 'item.jpg' } as any);
      const { data } = await api.post<{ url: string }>('/api/items/remove-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProcessedUri(data.url);
    } catch {
      setProcessedUri(uri);
    } finally {
      setRemoving(false);
    }

    try {
      const analysisData = new FormData();
      analysisData.append('image', { uri, type: 'image/jpeg', name: 'item.jpg' } as any);
      const { data } = await api.post('/api/items/analyze', analysisData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      applyDetectedData(data);
      showToast('AI details added. Review before saving.', 'success');
    } catch {
      showToast('Photo added. Enter or review the details manually.', 'info');
    } finally {
      setAnalyzing(false);
    }
  }

  function isWebUrl(value: string) {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function useImageLink() {
    if (!isWebUrl(imageLink)) {
      showToast('Enter a valid image URL', 'error');
      return;
    }
    const url = imageLink.trim();
    setImageUri(url);
    setProcessedUri(url);
    setAnalyzing(true);
    try {
      const { data } = await api.post('/api/items/analyze-url', { imageUrl: url });
      applyDetectedData(data);
      showToast('AI details added. Review before saving.', 'success');
    } catch {
      showToast('Image added. Enter the details manually.', 'info');
    } finally {
      setAnalyzing(false);
    }
  }

  async function importProductLink() {
    if (!isWebUrl(productLink)) {
      showToast('Enter a valid product URL', 'error');
      return;
    }
    setFetchingLink(true);
    try {
      const url = productLink.trim();
      const { data } = await api.post('/api/items/import-url', { url });
      applyDetectedData({ ...data, productUrl: url });
      setForm((previous) => ({ ...previous, productUrl: url }));
      showToast('Product details fetched. Review before saving.', 'success');
      setStep(2);
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Could not fetch this link. Continue with manual details.';
      showToast(message, 'error');
    } finally {
      setFetchingLink(false);
    }
  }

  function continueLinkManually() {
    if (productLink.trim() && !isWebUrl(productLink)) {
      showToast('Enter a valid product URL or leave it blank', 'error');
      return;
    }
    setForm((previous) => ({ ...previous, productUrl: productLink.trim() }));
    setStep(2);
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast('Camera permission required', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) await processImage(result.assets[0].uri);
  }

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Photo library permission required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled) await processImage(result.assets[0].uri);
  }

  function toggleMulti(field: 'seasons' | 'occasions', val: string) {
    setForm((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  }

  function validateStep2(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.category) e.category = 'Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (form.purchasePrice && !Number.isFinite(Number(form.purchasePrice))) {
      showToast('Enter a valid purchase price', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        itemType: form.itemType.trim() || undefined,
        color: [form.primaryColor.trim(), form.secondaryColor.trim()].filter(Boolean),
        primaryColor: form.primaryColor.trim() || undefined,
        secondaryColor: form.secondaryColor.trim() || undefined,
        size: form.size.trim() || undefined,
        material: form.material.trim() || undefined,
        pattern: form.pattern || undefined,
        seasons: form.seasons.length > 0 ? form.seasons : undefined,
        occasions: form.occasions.length > 0 ? form.occasions : undefined,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        currency: form.currency.trim() || 'USD',
        brand: form.brand.trim() || undefined,
        notes: form.notes.trim() || undefined,
        productUrl: form.productUrl || undefined,
        sourceMethod: method,
        imageUrl: processedUri,
        isWishlist: isWishlist === 'true' || undefined,
      };

      if (id) {
        await api.put(`/api/items/${id}`, payload);
        showToast('Item updated!', 'success');
      } else {
        await api.post('/api/items', payload);
        showToast(isWishlist === 'true' ? 'Added to wishlist!' : 'Added to wardrobe!', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to save item';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  const STEP_TITLES: Record<Step, string> = {
    1: method === 'photo' ? 'ADD PHOTO' : method === 'link' ? 'PASTE LINK' : (id ? 'EDIT ITEM' : 'ADD ITEM'),
    2: 'DETAILS',
    3: 'CONFIRM',
  };

  function handleBack() {
    if (step === 2 && method === 'manual') {
      setStep(1);
      setMethod(null);
    } else if (step > 1) setStep((step - 1) as Step);
    else if (method) setMethod(null);
    else router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: Math.max(top, 20),
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
          backgroundColor: colors.white,
        }}
      >
        <Pressable hitSlop={16} onPress={handleBack}>
          <X color={colors.black} size={22} weight="bold" />
        </Pressable>
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 18,
            color: colors.black,
            letterSpacing: -0.4,
            flex: 1,
            textAlign: 'center',
          }}
        >
          {STEP_TITLES[step]}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <StepDots step={step} />

      {/* Step 1 */}
      {step === 1 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 16, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!method ? (
            <>
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 20,
                  color: colors.black,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                How are you adding it?
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 12 }}>
                Every option ends with an editable details form.
              </Text>
              {[
                { method: 'photo' as const, title: 'Photo or image', body: 'Browse, take a photo, or paste an image URL. AI fills the details.' },
                { method: 'link' as const, title: 'Paste product link', body: 'Fetch product information with AI, then review it manually.' },
              ].map((option) => (
                <NBCard
                  key={option.method}
                  onPress={() => {
                    setMethod(option.method);
                    if (option.method === 'manual') setStep(2);
                  }}
                  style={{ padding: 18 }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 17, color: colors.black }}>{option.title}</Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#666', marginTop: 5, lineHeight: 19 }}>{option.body}</Text>
                </NBCard>
              ))}
            </>
          ) : method === 'link' ? (
            <>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 17, color: colors.black, textAlign: 'center' }}>
                Paste a store or product page link
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 19 }}>
                AI fetches available images, name, brand, colors, material, price, and details.
              </Text>
              <NBInput label="Product link" placeholder="https://store.example.com/product" value={productLink} onChangeText={setProductLink} keyboardType="url" autoCapitalize="none" />
              <NBButton label="Fetch with AI" variant="ai" fullWidth loading={fetchingLink} onPress={importProductLink} />
              <NBButton label="Continue manually" variant="secondary" fullWidth onPress={continueLinkManually} />
            </>
          ) : !imageUri ? (
            <>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 17, color: colors.black, textAlign: 'center' }}>
                Drop image, paste, or browse
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#666', textAlign: 'center' }}>
                AI will auto-fill details from your photo.
              </Text>
              <NBButton label="Take Photo" variant="primary" fullWidth onPress={pickFromCamera} />
              <NBButton label="Browse Photos" variant="secondary" fullWidth onPress={pickFromLibrary} />
              <NBInput label="Or paste an image URL" placeholder="https://example.com/item.jpg" value={imageLink} onChangeText={setImageLink} keyboardType="url" autoCapitalize="none" />
              <NBButton label="Use image URL" variant="secondary" fullWidth loading={analyzing} onPress={useImageLink} />
            </>
          ) : (
            <View style={{ minHeight: 520, gap: 16 }}>
              <View
                style={{
                  flex: 1,
                  borderWidth: 3,
                  borderColor: colors.black,
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Checkerboard />
                {removing || analyzing ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }}
                  >
                    <ActivityIndicator color={colors.yellow} size="large" />
                    <Text
                      style={{
                        fontFamily: 'SpaceGrotesk-Bold',
                        fontSize: 14,
                        color: colors.white,
                        marginTop: 12,
                      }}
                    >
                      {removing ? 'Cleaning image...' : 'AI is reading details...'}
                    </Text>
                  </View>
                ) : processedUri ? (
                  <Image
                    source={{ uri: processedUri }}
                    style={{ flex: 1 }}
                    contentFit="contain"
                    transition={300}
                  />
                ) : null}
              </View>

              {!removing && !analyzing && processedUri && (
                <View style={{ gap: 10 }}>
                  <NBButton
                    label="Looks good"
                    variant="primary"
                    fullWidth
                    onPress={() => setStep(2)}
                  />
                  <NBButton
                    label="Retake"
                    variant="secondary"
                    fullWidth
                    onPress={() => { setImageUri(null); setProcessedUri(null); }}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <NBCard>
            {processedUri ? (
              <View style={{ height: 180 }}>
                <Checkerboard />
                <Image source={{ uri: processedUri }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
              </View>
            ) : null}
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                Item image {processedUri ? '' : '(optional)'}
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#666' }}>
                Browse, take a photo, or paste an image URL. AI will try to fill the fields.
              </Text>
              <NBButton label={processedUri ? 'Replace from photos' : 'Browse photos'} variant="secondary" fullWidth onPress={pickFromLibrary} />
              <NBButton label="Take photo" variant="secondary" fullWidth onPress={pickFromCamera} />
              <NBInput label="Image URL" placeholder="https://example.com/item.jpg" value={imageLink} onChangeText={setImageLink} keyboardType="url" autoCapitalize="none" />
              <NBButton label="Use image URL" variant="ai" fullWidth loading={analyzing} onPress={useImageLink} />
            </View>
          </NBCard>

          <NBInput label="Item name *" placeholder="e.g. White Oxford Shirt" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} error={errors.name} />

          <View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, marginBottom: 8 }}>
              Category *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <NBChip
                  key={cat.value}
                  label={cat.label}
                  selected={form.category === cat.value}
                  onPress={() => setForm((p) => ({ ...p, category: cat.value }))}
                />
              ))}
            </ScrollView>
            {errors.category ? (
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: colors.pink, marginTop: 4 }}>
                {errors.category}
              </Text>
            ) : null}
          </View>

          <NBInput label="Item type" placeholder="e.g. Polo, Jeans, Sneakers" value={form.itemType} onChangeText={(v) => setForm((p) => ({ ...p, itemType: v }))} />
          <NBInput label="Brand" placeholder="e.g. Nike, Zara" value={form.brand} onChangeText={(v) => setForm((p) => ({ ...p, brand: v }))} />
          <NBInput label="Primary color" placeholder="e.g. Navy Blue" value={form.primaryColor} onChangeText={(v) => setForm((p) => ({ ...p, primaryColor: v }))} />
          <NBInput label="Secondary color" placeholder="e.g. White (optional)" value={form.secondaryColor} onChangeText={(v) => setForm((p) => ({ ...p, secondaryColor: v }))} />
          <NBInput label="Pattern" placeholder="e.g. Striped, Floral" value={form.pattern} onChangeText={(v) => setForm((p) => ({ ...p, pattern: v }))} />

          <View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, marginBottom: 8 }}>
              Pattern
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PATTERNS.map((p) => (
                <NBChip
                  key={p}
                  label={p}
                  selected={form.pattern === p}
                  onPress={() => setForm((prev) => ({ ...prev, pattern: prev.pattern === p ? '' : p }))}
                />
              ))}
            </ScrollView>
          </View>

          <NBInput label="Material" placeholder="e.g. Cotton, Polyester" value={form.material} onChangeText={(v) => setForm((p) => ({ ...p, material: v }))} />
          <NBInput label="Size" placeholder="e.g. M, 32, 9.5" value={form.size} onChangeText={(v) => setForm((p) => ({ ...p, size: v }))} />

          <View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, marginBottom: 8 }}>
              Season
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SEASONS.map((s) => (
                <NBChip
                  key={s}
                  label={s}
                  selected={form.seasons.includes(s)}
                  onPress={() => toggleMulti('seasons', s)}
                />
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, marginBottom: 8 }}>
              Occasion
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {OCCASIONS.map((o) => (
                <NBChip
                  key={o}
                  label={o}
                  selected={form.occasions.includes(o)}
                  onPress={() => toggleMulti('occasions', o)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <NBInput label="Purchase price" placeholder="0.00" value={form.purchasePrice} onChangeText={(v) => setForm((p) => ({ ...p, purchasePrice: v }))} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <NBInput label="Currency" placeholder="USD" value={form.currency} onChangeText={(v) => setForm((p) => ({ ...p, currency: v.toUpperCase() }))} autoCapitalize="characters" style={{ width: 110 }} />
          </View>

          <NBInput label="Additional notes" placeholder="Any additional notes..." value={form.notes} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} multiline />

          <NBButton
            label="Next"
            variant="primary"
            fullWidth
            onPress={() => { if (validateStep2()) setStep(3); }}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <NBCard>
            {processedUri && (
              <View style={{ height: 240 }}>
                <Checkerboard />
                <Image
                  source={{ uri: processedUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                />
              </View>
            )}
            <View style={{ padding: 16, gap: 12 }}>
              <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 18, color: colors.black }}>
                {form.name}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {form.category ? <NBBadge label={form.category} /> : null}
                {form.itemType ? <NBBadge label={form.itemType} variant="neutral" /> : null}
                {form.size ? <NBBadge label={form.size} variant="neutral" /> : null}
                {form.brand ? <NBBadge label={form.brand} variant="neutral" /> : null}
                {form.primaryColor ? <NBBadge label={form.primaryColor} variant="neutral" /> : null}
                {form.secondaryColor ? <NBBadge label={form.secondaryColor} variant="neutral" /> : null}
                {form.pattern ? <NBBadge label={form.pattern} variant="neutral" /> : null}
                {form.material ? <NBBadge label={form.material} variant="neutral" /> : null}
                {form.purchasePrice ? <NBBadge label={`${form.currency} ${form.purchasePrice}`} variant="new" /> : null}
                {form.seasons.map((s) => <NBBadge key={s} label={s} variant="neutral" />)}
                {form.occasions.map((o) => <NBBadge key={o} label={o} variant="neutral" />)}
              </View>
              {form.notes ? (
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#666', lineHeight: 19 }}>
                  {form.notes}
                </Text>
              ) : null}
            </View>
          </NBCard>

          <NBButton
            label={id ? "Save Changes" : (isWishlist === 'true' ? "Add to Wishlist" : "Add to Wardrobe")}
            variant="primary"
            fullWidth
            loading={saving}
            onPress={handleSave}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
