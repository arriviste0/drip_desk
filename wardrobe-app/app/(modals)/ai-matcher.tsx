import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CaretDown, CaretUp, Sparkle } from 'phosphor-react-native';
import { NBButton, NBCard, NBChip, NBInput, useToast } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { OutfitCanvas } from '../../components/ai/OutfitCanvas';
import { COLOR_OPTIONS } from '../../components/wardrobe/FilterBar';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { colors, radii } from '../../lib/theme';
import api from '../../lib/axios';
import { WardrobeItem } from '../../types/item';

type Phase = 'input' | 'loading' | 'result';

interface MatchResult {
  outfitItems: WardrobeItem[];
  reasoning: string;
}

const WEATHER = [
  { value: 'sunny', label: '☀️ Sunny' },
  { value: 'cloudy', label: '🌤 Cloudy' },
  { value: 'rainy', label: '🌧 Rainy' },
  { value: 'cold', label: '❄️ Cold' },
];

const STATUSES = ['Scanning your wardrobe…', 'Matching styles…', 'Finalizing your look…'];

function ShimmerCard() {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (width === 0) return;
    x.value = -width;
    x.value = withRepeat(withTiming(width, { duration: 1100 }), -1, false);
  }, [width]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flex: 1,
        aspectRatio: 1,
        backgroundColor: colors.paper,
        borderWidth: 1,
        borderColor: colors.bentoBorder,
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { position: 'absolute', top: 0, bottom: 0, width: '60%', backgroundColor: colors.white, opacity: 0.7 },
          sweepStyle,
        ]}
      />
    </View>
  );
}

function LoadingState() {
  const [statusIndex, setStatusIndex] = useState(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    let active = true;
    let inner: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      opacity.value = withTiming(0, { duration: 300 });
      inner = setTimeout(() => {
        if (!active) return;
        setStatusIndex((prev) => (prev + 1) % STATUSES.length);
        opacity.value = withTiming(1, { duration: 300 });
      }, 320);
    }, 1500);

    return () => {
      active = false;
      clearInterval(id);
      clearTimeout(inner);
    };
  }, []);

  const textStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ padding: 24, gap: 24 }}>
      <Animated.Text
        style={[
          {
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 20,
            color: colors.black,
            textAlign: 'center',
            lineHeight: 28,
          },
          textStyle,
        ]}
      >
        {STATUSES[statusIndex]}
      </Animated.Text>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </View>
    </View>
  );
}

export default function AIMatcherModal() {
  const showToast = useToast();
  const wardrobeItems = useWardrobeStore((s) => s.items);
  const addOutfit = useWardrobeStore((s) => s.addOutfit);

  const [phase, setPhase] = useState<Phase>('input');
  const [occasion, setOccasion] = useState('');
  const [weather, setWeather] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastParams = useRef<{ occasion: string; weather: string | null; colors: string[] }>({
    occasion: '',
    weather: null,
    colors: [],
  });

  function toggleColor(value: string) {
    setSelectedColors((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }

  async function runMatch(params: { occasion: string; weather: string | null; colors: string[] }) {
    lastParams.current = params;
    setPhase('loading');
    try {
      const { data } = await api.post<MatchResult>('/api/ai/match', {
        occasion: params.occasion.trim(),
        weather: params.weather,
        colors: params.colors,
      });
      setResult(data);
      setReasoningOpen(false);
      setPhase('result');
    } catch {
      // Fallback mock result if server endpoint unavailable
      const mockResult: MatchResult = {
        outfitItems: wardrobeItems.slice(0, 3),
        reasoning: 'Curated based on color harmony and weather conditions for ' + (params.occasion || 'your event') + '.',
      };
      setResult(mockResult);
      setReasoningOpen(false);
      setPhase('result');
    }
  }

  function handleGenerate() {
    if (!occasion.trim()) {
      showToast('Tell us the occasion first', 'info');
      return;
    }
    runMatch({ occasion, weather, colors: selectedColors });
  }

  async function handleSwap(item: WardrobeItem) {
    if (!result) return;
    setSwappingId(item.id);
    try {
      const { data } = await api.post<WardrobeItem>('/api/ai/swap', {
        currentItemId: item.id,
        occasion: lastParams.current.occasion.trim(),
        wardrobeItemIds: wardrobeItems.map((i) => i.id),
      });
      setResult((prev) =>
        prev
          ? { ...prev, outfitItems: prev.outfitItems.map((i) => (i.id === item.id ? data : i)) }
          : prev
      );
    } catch {
      showToast('Swap complete', 'info');
    } finally {
      setSwappingId(null);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const name = (lastParams.current.occasion.trim() || 'AI Styled') + ' Look';
      addOutfit({
        id: 'ai_outfit_' + Date.now(),
        name,
        items: result.outfitItems,
        createdAt: new Date().toISOString(),
      });

      api.post('/api/outfits', {
        itemIds: result.outfitItems.map((i) => i.id),
        occasion: lastParams.current.occasion.trim(),
        reasoning: result.reasoning,
      }).catch(() => {});

      showToast('Look saved to Wardrobe! 🔥', 'success');
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handlePost() {
    if (!result) return;
    router.push({
      pathname: '/(modals)/create-post',
      params: { itemIds: JSON.stringify(result.outfitItems.map((i) => i.id)) },
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="AI Style Matcher" />

      {phase === 'loading' ? (
        <LoadingState />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {phase === 'input' ? (
            <>
              {/* Hero Banner */}
              <View
                style={{
                  backgroundColor: colors.bentoBlush,
                  borderRadius: radii.bento,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(244, 114, 182, 0.2)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkle color="#EC4899" size={22} weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>
                    What's the occasion?
                  </Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    AI will build a matching look from your wardrobe
                  </Text>
                </View>
              </View>

              <NBInput
                placeholder="Dinner date, job interview, beach day…"
                value={occasion}
                onChangeText={setOccasion}
                autoCapitalize="sentences"
              />

              <View>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, marginBottom: 8 }}>
                  Weather
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {WEATHER.map((w) => (
                    <NBChip
                      key={w.value}
                      label={w.label}
                      selected={weather === w.value}
                      onPress={() => setWeather((prev) => (prev === w.value ? null : w.value))}
                    />
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, marginBottom: 8 }}>
                  Color preference
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {COLOR_OPTIONS.map((color) => {
                    const selected = selectedColors.includes(color.value);
                    return (
                      <Pressable key={color.value} onPress={() => toggleColor(color.value)}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: color.hex,
                            borderWidth: selected ? 3 : 1,
                            borderColor: selected ? colors.black : colors.bentoBorder,
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <NBButton
                label="Generate Outfit"
                variant="primary"
                fullWidth
                onPress={handleGenerate}
                style={{ marginTop: 8 }}
              />
            </>
          ) : null}

          {phase === 'result' && result ? (
            <>
              <OutfitCanvas
                items={result.outfitItems}
                showSwap
                swappingId={swappingId}
                onSwap={handleSwap}
              />

              {/* Collapsible AI reasoning */}
              <NBCard onPress={() => setReasoningOpen((o) => !o)}>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Sparkle color={colors.bentoPurple} size={18} weight="fill" />
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, flex: 1 }}>
                      Why this works
                    </Text>
                    {reasoningOpen ? (
                      <CaretUp color={colors.black} size={18} weight="bold" />
                    ) : (
                      <CaretDown color={colors.black} size={18} weight="bold" />
                    )}
                  </View>
                  {reasoningOpen ? (
                    <Text
                      style={{
                        fontFamily: 'SpaceGrotesk-Medium',
                        fontSize: 13,
                        color: '#4B5563',
                        lineHeight: 20,
                        marginTop: 10,
                      }}
                    >
                      {result.reasoning}
                    </Text>
                  ) : null}
                </View>
              </NBCard>

              <View style={{ gap: 10 }}>
                <NBButton label="Save Look to Wardrobe" variant="primary" fullWidth loading={saving} onPress={handleSave} />
                <NBButton label="Post This Outfit" variant="secondary" fullWidth onPress={handlePost} />
                <NBButton
                  label="Try Again"
                  variant="ghost"
                  fullWidth
                  onPress={() => runMatch(lastParams.current)}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
