import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CaretRight, Bell, Lock, PencilSimple } from 'phosphor-react-native';
import { NBButton, NBCard } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { useAuthStore } from '../../store/authStore';
import { colors, radii } from '../../lib/theme';

interface Row {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  bg: string;
}

const ROWS: Row[] = [
  {
    icon: <PencilSimple color="#EC4899" size={20} weight="bold" />,
    label: 'Edit Profile',
    description: 'Avatar, username, display name & bio',
    href: '/settings/edit-profile',
    bg: colors.bentoBlush,
  },
  {
    icon: <Lock color={colors.bentoPurple} size={20} weight="bold" />,
    label: 'Privacy Settings',
    description: 'Control who can view your looks',
    href: '/settings/privacy',
    bg: colors.bentoLavender,
  },
  {
    icon: <Bell color={colors.bentoMint} size={20} weight="bold" />,
    label: 'Notification Preferences',
    description: 'Likes, comments & follower alerts',
    href: '/settings/notifications',
    bg: colors.bentoMintLight,
  },
];

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {ROWS.map((row) => (
          <NBCard key={row.href} onPress={() => router.push(row.href as never)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: row.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {row.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                  {row.label}
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {row.description}
                </Text>
              </View>
              <CaretRight color="#9CA3AF" size={18} weight="bold" />
            </View>
          </NBCard>
        ))}

        <View style={{ marginTop: 24 }}>
          <NBButton label="Log Out" variant="danger" fullWidth onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}
