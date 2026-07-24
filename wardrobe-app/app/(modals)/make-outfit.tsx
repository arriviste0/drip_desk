import { useState } from 'react';
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
import { router } from 'expo-router';
import { X, CheckCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { NBButton, NBCard, useToast } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { colors, radii } from '../../lib/theme';
import { WardrobeItem } from '../../types/item';
import api from '../../lib/axios';

const CATEGORY_ORDER = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags'];

function CategoryLabel({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.bentoLavender,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 9999,
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: 6,
      }}
    >
      <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoPurple, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

function ItemTile({ item, selected, onPress }: { item: WardrobeItem; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: '30%',
        aspectRatio: 1,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.black : colors.bentoBorder,
        borderRadius: 18,
        backgroundColor: colors.white,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 10, color: '#666', textAlign: 'center' }}>
            {item.name}
          </Text>
        </View>
      )}
      {selected && (
        <View style={{ position: 'absolute', top: 4, right: 4 }}>
          <CheckCircle color={colors.bentoPurple} size={20} weight="fill" />
        </View>
      )}
      {selected && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 9, color: colors.white, textAlign: 'center' }} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function MakeOutfitModal() {
  const { top } = useSafeAreaInsets();
  const wardrobeItems = useWardrobeStore((s) => s.items);
  const addOutfit = useWardrobeStore((s) => s.addOutfit);
  const showToast = useToast();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const selectedItems = wardrobeItems.filter((i) => selectedIds.includes(i.id));

  const grouped = CATEGORY_ORDER.reduce<Record<string, WardrobeItem[]>>((acc, cat) => {
    const items = wardrobeItems.filter((i) => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  async function handleSave() {
    if (selectedIds.length < 2) {
      showToast('Pick at least 2 items for an outfit', 'info');
      return;
    }
    setSaving(true);
    try {
      const name = outfitName.trim() || 'My Custom Outfit';
      addOutfit({
        id: 'outfit_' + Date.now(),
        name,
        items: selectedItems,
        createdAt: new Date().toISOString(),
      });

      api.post('/api/outfits', {
        itemIds: selectedIds,
        name,
      }).catch(() => {});

      showToast('Outfit saved to Wardrobe! 🔥', 'success');
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handlePostOutfit() {
    router.replace({
      pathname: '/(modals)/create-post',
      params: { itemIds: JSON.stringify(selectedIds) },
    });
  }

  if (wardrobeItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <ScreenHeader title="Build Outfit" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 20, color: colors.black, textAlign: 'center', lineHeight: 28 }}>
            Your Closet is Empty
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            Add items to your wardrobe first to start building outfits
          </Text>
          <NBButton
            label="Add to Wardrobe"
            variant="primary"
            onPress={() => { router.back(); router.push('/(modals)/add-item'); }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Build Outfit" />

      {/* Selected items strip */}
      {selectedItems.length > 0 && (
        <View
          style={{
            backgroundColor: colors.white,
            borderBottomWidth: 1,
            borderBottomColor: colors.bentoBorder,
            paddingVertical: 10,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, flexDirection: 'row' }}
          >
            {selectedItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                  backgroundColor: colors.paper,
                  overflow: 'hidden',
                }}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 8, color: '#555', textAlign: 'center', padding: 2 }}>
                      {item.name}
                    </Text>
                  </View>
                )}
                <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: colors.black, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <X color={colors.white} size={10} weight="bold" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 14, gap: 4 }} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([category, items]) => (
          <View key={category}>
            <CategoryLabel label={category} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {items.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onPress={() => toggleItem(item.id)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Outfit name + actions */}
        {selectedIds.length >= 2 && (
          <NBCard style={{ marginTop: 8, padding: 18, gap: 14 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>
              Name This Look
            </Text>
            <TextInput
              placeholder="e.g. Summer Casual, Office Outfit…"
              placeholderTextColor="#9CA3AF"
              value={outfitName}
              onChangeText={setOutfitName}
              style={{
                borderWidth: 1,
                borderColor: colors.bentoBorder,
                backgroundColor: colors.paper,
                borderRadius: 16,
                padding: 12,
                fontFamily: 'SpaceGrotesk-Medium',
                fontSize: 14,
                color: colors.black,
              }}
            />
            <NBButton label="Save Outfit to Wardrobe" variant="primary" fullWidth loading={saving} onPress={handleSave} />
            <NBButton label="Post This Look" variant="secondary" fullWidth onPress={handlePostOutfit} />
          </NBCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
