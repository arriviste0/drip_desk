import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { House, MagnifyingGlass, Plus, CoatHanger, User, Camera, Sparkle, TShirt, Heart, CaretRight } from 'phosphor-react-native';
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
  icon, title, subtitle, onPress, bg = colors.paper,
}: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; bg?: string }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          gap: 6,
        }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bentoBorder }}>
          {icon}
        </View>
        <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, marginTop: 4 }}>
          {title}
        </Text>
        <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
          {subtitle}
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

      {/* Minimalist Create Bottom Sheet */}
      <NBBottomSheet ref={sheetRef} snapPoints={['54%']}>
        <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 24, gap: 12 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black, textAlign: 'center', letterSpacing: -0.3, marginBottom: 4 }}>
            Create & Add
          </Text>

          {/* 2-Column Balanced Grid Row 1 */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <CreateTile
              icon={<CoatHanger color={colors.bentoPurple} size={20} weight="bold" />}
              title="Add Item"
              subtitle="Catalog to closet"
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/add-item'); }}
            />
            <CreateTile
              icon={<Camera color={colors.black} size={20} weight="bold" />}
              title="Post Outfit"
              subtitle="Share to feed"
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/create-post'); }}
            />
          </View>

          {/* 2-Column Balanced Grid Row 2 */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <CreateTile
              icon={<Sparkle color={colors.bentoPurple} size={20} weight="fill" />}
              title="AI Matcher"
              subtitle="Smart outfits"
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/ai-matcher'); }}
            />
            <CreateTile
              icon={<TShirt color="#EC4899" size={20} weight="bold" />}
              title="Build Outfit"
              subtitle="Combine items"
              onPress={() => { sheetRef.current?.close(); router.push('/(modals)/make-outfit'); }}
            />
          </View>

          {/* Full-Width Minimalist Bottom Wishlist Action Bar */}
          <Pressable
            onPress={() => { sheetRef.current?.close(); router.push('/(modals)/add-item?isWishlist=true'); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.paper,
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
              gap: 12,
              marginTop: 2,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bentoBorder }}>
              <Heart color="#E11D48" size={20} weight="bold" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                Add to Wishlist
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
                Save items you want to buy later
              </Text>
            </View>
            <CaretRight color="#9CA3AF" size={16} weight="bold" />
          </Pressable>
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
