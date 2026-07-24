import { View, Text, Pressable, StatusBar, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Sparkle, CoatHanger, UsersThree, Cube, Flame } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';

const FEATURES = [
  { label: 'AI WARDROBE', icon: CoatHanger, bg: colors.bentoLavender, color: colors.bentoPurple },
  { label: 'SOCIAL FASHION', icon: UsersThree, bg: colors.bentoMintLight, color: colors.bentoMint },
  { label: '3D FIT MANNEQUIN', icon: Cube, bg: colors.bentoYellow, color: '#B45309' },
  { label: 'SMART DISCOVERY', icon: Flame, bg: colors.bentoRoseSoft, color: '#E11D48' },
];

export default function Welcome() {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Banner Navigation Header */}
      <View
        style={{
          paddingTop: top + 6,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
          backgroundColor: colors.white,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 14, color: colors.yellow }}>D</Text>
          </View>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black, letterSpacing: 0.5 }}>
            DRIP DECK
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bentoMintLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bentoMint }} />
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 10, color: colors.bentoMint, letterSpacing: 1 }}>
            AI OS ONLINE
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Main Bento Hero Card */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radii.bento,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 4,
            marginBottom: 20,
          }}
        >
          {/* Accent Badge */}
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.bentoLavender, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.bentoPurple }}>
              ✦ NEXT-GEN DIGITAL CLOSET
            </Text>
          </View>

          {/* Hero Titles */}
          <Text
            style={{
              fontFamily: 'DelaGothicOne',
              fontSize: 46,
              color: colors.black,
              letterSpacing: -1,
              lineHeight: 48,
            }}
          >
            DRIP
          </Text>
          <Text
            style={{
              fontFamily: 'DelaGothicOne',
              fontSize: 46,
              color: colors.bentoPurple,
              letterSpacing: -1,
              lineHeight: 48,
              marginBottom: 14,
            }}
          >
            DECK
          </Text>

          {/* Tagline */}
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Medium',
              fontSize: 15,
              color: '#4B5563',
              lineHeight: 23,
            }}
          >
            Your AI-powered digital closet & social fashion platform.{'\n'}Catalog items, craft outfits & share fits with the community.
          </Text>

          {/* Feature Grid Pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
            {FEATURES.map((f) => {
              const IconComp = f.icon;
              return (
                <View
                  key={f.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: f.bg,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                  }}
                >
                  <IconComp color={f.color} size={14} weight="bold" />
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: f.color, letterSpacing: 0.5 }}>
                    {f.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Action CTAs Block */}
        <View style={{ gap: 12 }}>
          {/* Sign In Primary CTA */}
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: colors.black,
              borderRadius: radii.bento,
              paddingVertical: 16,
              paddingHorizontal: 20,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.white, letterSpacing: 0.3 }}>
              Sign In to Your Account
            </Text>
            <ArrowRight color={colors.white} size={18} weight="bold" />
          </Pressable>

          {/* Create Account Secondary CTA */}
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: colors.white,
              borderRadius: radii.bento,
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            <Sparkle color={colors.bentoPurple} size={18} weight="bold" />
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black }}>
              Create New Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
