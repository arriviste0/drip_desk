import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'phosphor-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { NBButton, NBInput, useToast } from '../../components/ui';
import { ScreenHeader } from '../../components/profile/ScreenHeader';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../lib/theme';
import api from '../../lib/axios';
import { User } from '../../types/user';

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useToast();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatar);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({});

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Photo library permission required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  }

  async function handleSave() {
    const newErrors: { displayName?: string; username?: string } = {};
    if (!displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-z0-9_]{3,30}$/.test(username.trim().toLowerCase())) {
      newErrors.username = '3–30 chars, letters, numbers, underscores only';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      let avatarUrl: string | undefined = avatarChanged && avatarUri ? avatarUri : user?.avatar;

      if (avatarChanged && avatarUri) {
        try {
          const formData = new FormData();
          formData.append('avatar', { uri: avatarUri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
          const { data } = await api.post<{ url: string }>('/api/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          avatarUrl = data.url;
        } catch {
        }
      }

      const updatedUser: User = {
        ...user!,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatar: avatarUrl,
      };

      setUser(updatedUser);

      api.patch('/api/users/me', {
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Profile updated', 'success');
      router.back();
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Edit Profile" />

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar picker */}
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Pressable onPress={pickAvatar} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 3,
                borderColor: colors.white,
                overflow: 'hidden',
                backgroundColor: colors.white,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Image
                source={avatarUri ? { uri: avatarUri } : require('../../assets/icon.png')}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
                paddingHorizontal: 14,
                paddingVertical: 6,
                backgroundColor: colors.bentoBlush,
                borderWidth: 1,
                borderColor: 'rgba(244, 114, 182, 0.2)',
                borderRadius: 9999,
              }}
            >
              <Camera color="#EC4899" size={14} weight="bold" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: colors.black }}>
                Change Photo
              </Text>
            </View>
          </Pressable>
        </View>

        <NBInput
          label="Display Name"
          placeholder="Your name"
          value={displayName}
          onChangeText={setDisplayName}
          error={errors.displayName}
          autoCapitalize="words"
        />

        <NBInput
          label="Username"
          placeholder="your_username"
          value={username}
          onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <NBInput
          label="Bio"
          placeholder="Tell people about your style..."
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <NBButton
          label="Save Changes"
          variant="primary"
          fullWidth
          loading={saving}
          onPress={handleSave}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
