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

function MiniBentoStat({
  value,
  label,
  onPress,
  bg,
  textColor,
}: {
  value: number;
  label: string;
  onPress?: () => void;
  bg: string;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.bento,
        backgroundColor: bg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 22,
          color: textColor,
          lineHeight: 26,
        }}
      >
        {value ?? 0}
      </Text>
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Medium',
          fontSize: 10,
          color: textColor,
          marginTop: 2,
          opacity: 0.85,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
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
    <View style={{ backgroundColor: colors.paper, paddingHorizontal: 14, paddingTop: top + 10, paddingBottom: 12 }}>
      {/* Top Bar Navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 14,
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

      {/* Main Bento Hero Profile Box */}
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
          shadowRadius: 12,
          elevation: 3,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Circular Bento Avatar */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 3,
              borderColor: colors.white,
              backgroundColor: colors.bentoPaper ?? '#F3F4F6',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Image
              source={user.avatar ? { uri: user.avatar } : require('../../assets/icon.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Details */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 20,
                  color: colors.black,
                  letterSpacing: -0.3,
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

        {/* Bio */}
        {user.bio ? (
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Medium',
              fontSize: 13,
              color: '#4B5563',
              lineHeight: 19,
              marginTop: 14,
            }}
          >
            {user.bio}
          </Text>
        ) : null}

        {actionSlot ? <View style={{ marginTop: 14 }}>{actionSlot}</View> : null}
      </View>

      {/* Bento Stats Row — Distinct Pastel Color Blocks */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MiniBentoStat
          value={user.followersCount}
          label="Followers"
          onPress={onFollowersPress}
          bg={colors.bentoMintLight}
          textColor={colors.bentoMint}
        />
        <MiniBentoStat
          value={user.followingCount}
          label="Following"
          onPress={onFollowingPress}
          bg={colors.bentoLavender}
          textColor={colors.bentoPurple}
        />
        <MiniBentoStat
          value={user.wardrobeCount}
          label="Items"
          onPress={onItemsPress}
          bg={colors.bentoYellow}
          textColor="#B45309"
        />
      </View>
    </View>
  );
}
