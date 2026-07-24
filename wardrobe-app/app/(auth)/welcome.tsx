import { View, Text, Pressable, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../lib/theme';

const FEATURES = [
  { label: '✦ AI WARDROBE', bg: colors.yellow },
  { label: '✦ SOCIAL FASHION', bg: colors.pink },
  { label: '✦ RESALE MARKET', bg: colors.lime },
] as const;

function BrutalButton({
  label,
  bg,
  textColor,
  borderColor,
  onPress,
}: {
  label: string;
  bg: string;
  textColor: string;
  borderColor: string;
  onPress: () => void;
}) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(pressed.value * 6, { duration: 60 }) },
      { translateY: withTiming(pressed.value * 6, { duration: 60 }) },
    ],
    shadowOffset: {
      width: withTiming((1 - pressed.value) * 6, { duration: 60 }),
      height: withTiming((1 - pressed.value) * 6, { duration: 60 }),
    },
  }));

  return (
    <Pressable
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={onPress}
      style={{ width: '100%' }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: bg,
            borderWidth: 3,
            borderColor,
            borderRadius: 0,
            paddingVertical: 18,
            alignItems: 'center',
            shadowColor: colors.black,
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 6,
          },
          animStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 15,
            color: textColor,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Welcome() {
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <StatusBar barStyle="light-content" />

      {/* ── Yellow top bar ── */}
      <View
        style={{
          paddingTop: top,
          backgroundColor: colors.yellow,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 10,
            color: colors.black,
            letterSpacing: 3,
            flex: 1,
          }}
        >
          ✦ AI FASHION TECH ✦
        </Text>
        <View
          style={{
            backgroundColor: colors.black,
            paddingVertical: 4,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 9,
              color: colors.yellow,
              letterSpacing: 2,
            }}
          >
            BETA
          </Text>
        </View>
      </View>

      {/* ── Hero block ── */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 44 }}>
        {/* Brand display text */}
        <Text
          style={{
            fontFamily: 'DelaGothicOne',
            fontSize: 82,
            color: colors.white,
            letterSpacing: -2,
            lineHeight: 80,
          }}
        >
          DRIP
        </Text>
        <Text
          style={{
            fontFamily: 'DelaGothicOne',
            fontSize: 82,
            color: colors.yellow,
            letterSpacing: -2,
            lineHeight: 80,
          }}
        >
          DECK
        </Text>

        {/* Short accent bar */}
        <View
          style={{
            width: 60,
            height: 4,
            backgroundColor: colors.white,
            marginTop: 28,
            marginBottom: 20,
          }}
        />

        {/* Tagline */}
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 15,
            color: '#666',
            lineHeight: 24,
            letterSpacing: 0.3,
          }}
        >
          Your AI-powered wardrobe.{'\n'}Styled for the fashion obsessed.
        </Text>

        {/* Feature badges — horizontal row */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 36,
          }}
        >
          {FEATURES.map((f) => (
            <View
              key={f.label}
              style={{
                backgroundColor: f.bg,
                borderWidth: 2,
                borderColor: colors.black,
                paddingVertical: 8,
                paddingHorizontal: 14,
                shadowColor: colors.black,
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 11,
                  color: colors.black,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {f.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Push CTAs to the bottom */}
        <View style={{ flex: 1 }} />

        {/* CTA buttons */}
        <View style={{ gap: 14, marginBottom: 8 }}>
          <BrutalButton
            label="Sign In"
            bg={colors.yellow}
            textColor={colors.black}
            borderColor={colors.black}
            onPress={() => router.push('/(auth)/login')}
          />
          <BrutalButton
            label="Create Account"
            bg="transparent"
            textColor={colors.white}
            borderColor={colors.white}
            onPress={() => router.push('/(auth)/signup')}
          />
        </View>
      </View>

      {/* ── Pink bottom stripe ── */}
      <View style={{ height: 4, backgroundColor: colors.pink }} />
    </View>
  );
}
