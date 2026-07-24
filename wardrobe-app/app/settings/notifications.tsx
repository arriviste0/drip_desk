import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NBButton, useToast } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { colors, radii } from '../../lib/theme';
import api from '../../lib/axios';

type NotificationKey = 'likes' | 'comments' | 'follows' | 'offers' | 'sales' | 'mentions';

type NotificationPrefs = Record<NotificationKey, boolean>;

const ITEMS: Array<{ key: NotificationKey; label: string; description: string }> = [
  { key: 'likes', label: 'Likes', description: 'When someone likes your post' },
  { key: 'comments', label: 'Comments', description: 'When someone comments on your post' },
  { key: 'follows', label: 'New Followers', description: 'When someone follows you' },
  { key: 'offers', label: 'Offers', description: 'When you receive an offer on a listing' },
  { key: 'sales', label: 'Sales', description: 'When one of your items sells' },
  { key: 'mentions', label: 'Mentions', description: 'When someone mentions you' },
];

const DEFAULT_PREFS: NotificationPrefs = {
  likes: true,
  comments: true,
  follows: true,
  offers: true,
  sales: true,
  mentions: true,
};

export default function NotificationsScreen() {
  const showToast = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: async () => {
      const { data } = await api.get<NotificationPrefs>('/api/users/me/notifications');
      return data;
    },
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (data) setPrefs((prev) => ({ ...prev, ...data }));
  }, [data]);

  function toggle(key: NotificationKey) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    api.patch('/api/users/me/notifications', prefs).catch(() => {});
    showToast('Preferences saved', 'success');
    setSaving(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScreenHeader title="Notification Preferences" />

      <View style={{ padding: 16, gap: 10, flex: 1 }}>
        {ITEMS.map((item) => (
          <View
            key={item.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
              borderRadius: radii.bento,
              backgroundColor: colors.white,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                {item.label}
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {item.description}
              </Text>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: '#E5E7EB', true: colors.bentoPurple }}
              thumbColor={colors.white}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        ))}

        <View style={{ flex: 1 }} />

        <NBButton
          label="Save Preferences"
          variant="primary"
          fullWidth
          loading={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}
