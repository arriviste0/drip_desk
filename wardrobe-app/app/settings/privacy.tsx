import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { NBButton, useToast } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { useAuthStore } from '../../store/authStore';
import { colors, radii } from '../../lib/theme';
import api from '../../lib/axios';
import { ProfileVisibility } from '../../types/user';

const OPTIONS: Array<{ value: ProfileVisibility; label: string; description: string }> = [
  { value: 'public', label: 'Public', description: 'Anyone can see your profile and posts' },
  { value: 'friends', label: 'Friends-only', description: 'Only people you follow back can see your posts' },
  { value: 'private', label: 'Private', description: 'Only approved followers can see your profile' },
];

export default function PrivacyScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useToast();

  const [visibility, setVisibility] = useState<ProfileVisibility>(user?.visibility ?? 'public');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    if (user) setUser({ ...user, visibility });
    api.patch('/api/users/me/privacy', { visibility }).catch(() => {});
    showToast('Privacy settings saved', 'success');
    setSaving(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScreenHeader title="Privacy Settings" />

      <View style={{ padding: 16, gap: 12, flex: 1 }}>
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 13,
            color: '#6B7280',
            marginBottom: 2,
          }}
        >
          WHO CAN SEE YOUR PROFILE
        </Text>

        {OPTIONS.map((opt) => {
          const selected = visibility === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setVisibility(opt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: selected ? 'rgba(110, 86, 207, 0.3)' : colors.bentoBorder,
                borderRadius: radii.bento,
                backgroundColor: selected ? colors.bentoLavender : colors.white,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selected ? 0.04 : 0.02,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                  {opt.label}
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {opt.description}
                </Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: selected ? colors.bentoPurple : colors.paper,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected ? <Check color={colors.white} size={14} weight="bold" /> : null}
              </View>
            </Pressable>
          );
        })}

        <View style={{ flex: 1 }} />

        <NBButton
          label="Save Settings"
          variant="primary"
          fullWidth
          loading={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}
