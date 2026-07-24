import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';
import { NBAvatar, NBEmptyState } from '../ui';
import { FollowListType, useFollowList } from '../../hooks/useProfile';
import { User } from '../../types/user';
import { colors } from '../../lib/theme';

interface UserListModalProps {
  visible: boolean;
  username?: string;
  type: FollowListType;
  onClose: () => void;
}

const TITLES: Record<FollowListType, string> = {
  followers: 'Followers',
  following: 'Following',
};

export function UserListModal({ visible, username, type, onClose }: UserListModalProps) {
  const { top } = useSafeAreaInsets();
  const { data: users, isLoading } = useFollowList(username, type, visible);

  function openProfile(target: string) {
    onClose();
    router.push({ pathname: '/(modals)/user-profile/[username]', params: { username: target } });
  }

  function renderItem({ item }: { item: User }) {
    return (
      <Pressable
        onPress={() => openProfile(item.username)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.white,
          borderRadius: 18,
          marginHorizontal: 14,
          marginVertical: 4,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
        }}
      >
        <NBAvatar uri={item.avatar} size="sm" isVerified={item.isVerified} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
            {item.displayName}
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 1 }}>
            @{item.username}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: colors.white,
            borderBottomWidth: 1,
            borderBottomColor: colors.bentoBorder,
          }}
        >
          <Pressable onPress={onClose} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper, marginRight: 12 }}>
            <X color={colors.black} size={18} weight="bold" />
          </Pressable>
          <Text
            style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black, letterSpacing: -0.4, flex: 1 }}
          >
            {TITLES[type]}
          </Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.black} size="large" />
          </View>
        ) : (
          <FlashList
            data={users ?? []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <NBEmptyState
                title={type === 'followers' ? 'No followers yet' : 'Not following anyone'}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}
      </View>
    </Modal>
  );
}
