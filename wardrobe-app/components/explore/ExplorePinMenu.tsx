import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { BookmarkSimple, CoatHanger, Heart, ShareNetwork, Eye, X, Sparkle, Plus } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';

export interface DiscoverPin {
  id: string;
  image: string;
  username: string;
  likes: number;
  tags: string[];
}

interface ExplorePinMenuProps {
  pin: DiscoverPin | null;
  visible: boolean;
  onDismiss: () => void;
  onSaveToLooks: (pin: DiscoverPin) => void;
  onSaveToCloset: (pin: DiscoverPin) => void;
  onAddToWishlist: (pin: DiscoverPin) => void;
  onRemixLook: (pin: DiscoverPin) => void;
  onSharePin: (pin: DiscoverPin) => void;
  onViewDetails: (pin: DiscoverPin) => void;
}

export function ExplorePinMenu({
  pin,
  visible,
  onDismiss,
  onSaveToLooks,
  onSaveToCloset,
  onAddToWishlist,
  onRemixLook,
  onSharePin,
  onViewDetails,
}: ExplorePinMenuProps) {
  if (!pin) return null;

  const actions = [
    {
      id: 'looks',
      label: 'Save to Looks',
      icon: <Sparkle color={colors.bentoPurple} size={22} weight="fill" />,
      bg: colors.bentoLavender,
      onPress: () => { onSaveToLooks(pin); onDismiss(); },
    },
    {
      id: 'closet',
      label: 'Add to Closet',
      icon: <CoatHanger color={colors.bentoMint} size={22} weight="bold" />,
      bg: colors.bentoMintLight,
      onPress: () => { onSaveToCloset(pin); onDismiss(); },
    },
    {
      id: 'wishlist',
      label: 'Add to Wishlist',
      icon: <Heart color="#EC4899" size={22} weight="fill" />,
      bg: colors.bentoRoseSoft,
      onPress: () => { onAddToWishlist(pin); onDismiss(); },
    },
    {
      id: 'remix',
      label: 'Remix in Build Look',
      icon: <Plus color="#B45309" size={22} weight="bold" />,
      bg: colors.bentoYellow,
      onPress: () => { onRemixLook(pin); onDismiss(); },
    },
    {
      id: 'share',
      label: 'Share Pin',
      icon: <ShareNetwork color={colors.black} size={22} weight="bold" />,
      bg: colors.paper,
      onPress: () => { onSharePin(pin); onDismiss(); },
    },
    {
      id: 'details',
      label: 'View Post Details',
      icon: <Eye color={colors.black} size={22} weight="bold" />,
      bg: colors.paper,
      onPress: () => { onViewDetails(pin); onDismiss(); },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
          paddingHorizontal: 14,
          paddingBottom: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.white,
            borderRadius: radii.bento,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
                Look Options
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                @{pin.username} • {pin.tags.join(' ')}
              </Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
              <X color={colors.black} size={18} weight="bold" />
            </Pressable>
          </View>

          {/* Action List */}
          <View style={{ gap: 10 }}>
            {actions.map((act) => (
              <Pressable
                key={act.id}
                onPress={act.onPress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: colors.paper,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: act.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {act.icon}
                </View>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black, flex: 1 }}>
                  {act.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
