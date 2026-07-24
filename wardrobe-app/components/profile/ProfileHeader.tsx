import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft, Check } from 'phosphor-react-native';
import { User } from '../../types/user';
import { colors, radii } from '../../lib/theme';

interface ProfileHeaderProps {
  user: User;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  onItemsPress?: () => void;
  topRight?: React.ReactNode;
  onBack?: () => void;
  actionSlot?: React.ReactNode;
}

export function ProfileHeader({
  user,
  onFollowersPress,
  onFollowingPress,
  onItemsPress,
  topRight,
  onBack,
  actionSlot,
}: ProfileHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.paper, paddingHorizontal: 14, paddingTop: top + 10, paddingBottom: 8 }}>
      {/* Top Bar Navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={{
              backgroundColor: colors.white,
              padding: 8,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
            }}
          >
            <CaretLeft color={colors.black} size={20} weight="bold" />
          </Pressable>
        ) : (
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: colors.black, letterSpacing: -0.5 }}>
            Profile
          </Text>
        )}
        <View style={{ flex: 1 }} />
        {topRight}
      </View>

      {/* Unified Minimalist Bento Hero Profile Card */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radii.bento,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
          elevation: 3,
        }}
      >
        {/* Profile Header Row: Avatar + Name + Handle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Circular Avatar */}
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 3,
              borderColor: colors.white,
              backgroundColor: colors.bentoPaper ?? '#F3F4F6',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Image
              source={user.avatar ? { uri: user.avatar } : require('../../assets/icon.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>

          {/* User Details */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 20,
                  color: colors.black,
                  letterSpacing: -0.4,
                }}
              >
                {user.displayName ?? user.username}
              </Text>
              {user.isVerified ? (
                <View
                  style={{
                    backgroundColor: colors.blue,
                    borderRadius: 9999,
                    padding: 3,
                  }}
                >
                  <Check color={colors.white} size={10} weight="bold" />
                </View>
              ) : null}
            </View>

            {/* Handle badge */}
            <View
              style={{
                backgroundColor: colors.bentoPaper ?? '#F3F4F6',
                alignSelf: 'flex-start',
                paddingVertical: 3,
                paddingHorizontal: 10,
                borderRadius: 9999,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 11,
                  color: '#4B5563',
                }}
              >
                @{user.username}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio Text */}
        {user.bio ? (
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Medium',
              fontSize: 13,
              color: '#4B5563',
              lineHeight: 19,
              marginTop: 12,
            }}
          >
            {user.bio}
          </Text>
        ) : null}

        {/* Action Button (e.g. Follow / Edit Profile) */}
        {actionSlot ? <View style={{ marginTop: 12 }}>{actionSlot}</View> : null}

        {/* Minimalist Instagram-Style Stats Strip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: 16,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.bentoBorder,
          }}
        >
          {/* Followers Stat */}
          <Pressable onPress={onFollowersPress} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
              {user.followersCount ?? 0}
            </Text>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Followers
            </Text>
          </Pressable>

          <View style={{ width: 1, height: 26, backgroundColor: '#E5E7EB' }} />

          {/* Following Stat */}
          <Pressable onPress={onFollowingPress} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
              {user.followingCount ?? 0}
            </Text>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Following
            </Text>
          </Pressable>

          <View style={{ width: 1, height: 26, backgroundColor: '#E5E7EB' }} />

          {/* Items Stat */}
          <Pressable onPress={onItemsPress} disabled={!onItemsPress} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
              {user.wardrobeCount ?? 0}
            </Text>
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Items
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
