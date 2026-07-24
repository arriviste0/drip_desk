import React, { useCallback, useEffect } from 'react';
import { Dimensions, Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  TShirt,
  ShareNetwork,
  Tag,
  Trash,
  CoatHanger,
} from 'phosphor-react-native';
import { WardrobeItem } from '../../types/item';
import { colors, radii } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.55;

interface PinActionMenuProps {
  item: WardrobeItem | null;
  visible: boolean;
  onDismiss: () => void;
  onAction: (action: string, item: WardrobeItem) => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}

function ActionButton({ icon, label, color, onPress }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      <View style={[styles.actionIconCircle, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function PinActionMenu({ item, visible, onDismiss, onAction }: PinActionMenuProps) {
  const opacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const menuTranslateY = useSharedValue(40);

  useEffect(() => {
    if (visible && item) {
      opacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withSpring(1, { damping: 14, stiffness: 250 });
      menuTranslateY.value = withSpring(0, { damping: 16, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.85, { duration: 150 });
      menuTranslateY.value = withTiming(40, { duration: 150 });
    }
  }, [visible, item]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: opacity.value,
  }));

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: menuTranslateY.value }],
    opacity: opacity.value,
  }));

  const handleAction = useCallback(
    (action: string) => {
      if (item) {
        onAction(action, item);
      }
      onDismiss();
    },
    [item, onAction, onDismiss]
  );

  if (!visible || !item) return null;

  const actions = [
    ...(item.isWishlist
      ? [
          {
            id: 'move_to_closet',
            label: 'Move to Closet',
            icon: <CoatHanger color={colors.bentoPurple} size={20} weight="bold" />,
            color: colors.bentoLavender,
          },
        ]
      : [
          {
            id: 'outfit',
            label: 'Add to Outfit',
            icon: <CoatHanger color={colors.black} size={20} weight="bold" />,
            color: colors.lime,
          },
        ]),
    {
      id: 'wear',
      label: 'Wear Today',
      icon: <TShirt color={colors.black} size={20} weight="bold" />,
      color: colors.yellow,
    },
    {
      id: 'sell',
      label: 'List for Sale',
      icon: <Tag color={colors.black} size={20} weight="bold" />,
      color: '#B8E6FF',
    },
    {
      id: 'share',
      label: 'Share',
      icon: <ShareNetwork color={colors.black} size={20} weight="bold" />,
      color: '#E0D4FF',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash color={colors.white} size={20} weight="bold" />,
      color: '#FF4444',
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.backdrop} />
          </BlurView>
        </Pressable>
      </Animated.View>

      {/* Content */}
      <View style={styles.contentContainer} pointerEvents="box-none">
        {/* Preview Card */}
        <Animated.View style={[styles.previewCard, cardStyle]}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.previewImage}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.previewOverlay}>
            <Text numberOfLines={1} style={styles.previewName}>
              {item.name}
            </Text>
            {item.brand && (
              <Text numberOfLines={1} style={styles.previewBrand}>
                {item.brand}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Action Menu */}
        <Animated.View style={[styles.menuContainer, menuStyle]}>
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onPress={() => handleAction(action.id)}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  previewCard: {
    width: CARD_WIDTH,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  previewOverlay: {
    padding: 14,
  },
  previewName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 15,
    color: colors.white,
    letterSpacing: 0.3,
  },
  previewBrand: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  menuContainer: {
    marginTop: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: radii.actionMenu,
    paddingVertical: 8,
    paddingHorizontal: 6,
    width: CARD_WIDTH + 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    width: '30%',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
