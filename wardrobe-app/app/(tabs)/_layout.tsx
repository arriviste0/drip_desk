import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { House, MagnifyingGlass, Plus, CoatHanger, User, Camera, Sparkle, TShirt, Heart } from 'phosphor-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NBBottomSheet } from '../../components/ui';
import { colors, radii } from '../../lib/theme';

interface TabRoute {
  key: string;
  name: keyof typeof TAB_ICONS;
  params?: Record<string, unknown>;
}

interface CustomTabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    navigate: (name: TabRoute['name'], params?: TabRoute['params']) => void;
    emit: (args: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
  };
}

function CreateTile({
  icon, label, bg, textColor = colors.black, onPress, flex = 1,
}: { icon: React.ReactNode; label: string; bg: string; textColor?: string; onPress: () => void; flex?: number }) {
  return (
    <Pressable onPress={onPress} style={{ flex }}>
      <View
        style={{
          backgroundColor: bg,
          borderRadius: radii.bento,
          padding: 16,
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {icon}
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: textColor, letterSpacing: 0.2 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const TAB_ICONS = {
  index: House,
  explore: MagnifyingGlass,
  create: Plus,
  wardrobe: CoatHanger,
  profile: User,
} as const;

const TAB_LABELS = {
  index: 'Home',
  explore: 'Explore',
  create: 'Create',
  wardrobe: 'Closet',
  profile: 'Profile',
} as const;

function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const { bottom } = useSafeAreaInsets();

  return (
    <>
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(bottom, 8),
          left: 14,
          right: 14,
          flexDirection: 'row',
          backgroundColor: colors.white,
          borderRadius: 32,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 6,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const isCreate = route.name === 'create';
          const Icon = TAB_ICONS[route.name];

          function handlePress() {
            if (isCreate) {
              sheetRef.current?.expand();
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              {isCreate ? (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.black,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Plus color={colors.white} size={22} weight="bold" />
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <View
                    style={{
                      width: 40,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isActive ? colors.bentoLavender : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      color={isActive ? colors.bentoPurple : '#9CA3AF'}
                      size={20}
                      weight={isActive ? 'fill' : 'regular'}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'SpaceGrotesk-Bold',
                      fontSize: 10,
                      color: isActive ? colors.bentoPurple : '#9CA3AF',
                    }}
                  >
                    {TAB_LABELS[route.name]}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <NBBottomSheet ref={sheetRef} snapPoints={['50%']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black, marginBottom: 16, textAlign: 'center', letterSpacing: -0.3 }}>
            Create New
          </Text>

          {/* Top row — primary actions */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <CreateTile
              icon={<Camera color={colors.black} size={24} weight="bold" />}
              label="Post Outfit"
              bg={colors.bentoYellow}
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/create-post'); }}
            />
            <CreateTile
              icon={<Sparkle color={colors.bentoPurple} size={24} weight="fill" />}
              label="AI Outfit"
              bg={colors.bentoLavender}
              textColor={colors.bentoPurple}
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/ai-matcher'); }}
            />
          </View>

          {/* Middle row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <CreateTile
              icon={<TShirt color="#BE185D" size={24} weight="bold" />}
              label="Build Outfit"
              bg={colors.bentoRose}
              textColor="#BE185D"
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/make-outfit'); }}
            />
            <CreateTile
              icon={<Plus color={colors.bentoMint} size={24} weight="bold" />}
              label="Add Item"
              bg={colors.bentoMintLight}
              textColor={colors.bentoMint}
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/add-item'); }}
            />
          </View>

          {/* Wishlist row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <CreateTile
              icon={<Heart color="#BE185D" size={24} weight="bold" />}
              label="Wishlist"
              bg={colors.bentoRose}
              textColor="#BE185D"
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/add-item?isWishlist=true'); }}
              flex={0.5}
            />
          </View>
        </View>
      </NBBottomSheet>
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as unknown as CustomTabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="wardrobe" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
