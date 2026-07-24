import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { X } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';
import { NBButton } from './NBButton';

interface NBModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

interface NBModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  actions?: NBModalAction[];
  style?: ViewStyle;
}

export function NBModal({ visible, onClose, title, children, actions, style }: NBModalProps) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.92, { duration: 100 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
            backdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            {
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.bentoBorder,
              borderRadius: radii.bento,
              width: '88%',
              maxHeight: '80%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 10,
              overflow: 'hidden',
            },
            contentStyle,
            style,
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: colors.bentoBorder,
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: colors.white,
            }}
          >
            {title ? (
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 18,
                  color: colors.black,
                  letterSpacing: -0.4,
                  flex: 1,
                }}
              >
                {title}
              </Text>
            ) : <View />}
            <Pressable onPress={onClose} hitSlop={10} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
              <X color={colors.black} size={18} weight="bold" />
            </Pressable>
          </View>

          <ScrollView
            style={{ padding: 20 }}
            contentContainerStyle={{ paddingBottom: actions?.length ? 0 : 4 }}
          >
            {children}
          </ScrollView>

          {actions?.length ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.bentoBorder,
                padding: 16,
                gap: 10,
              }}
            >
              {actions.map((action, i) => (
                <NBButton
                  key={i}
                  label={action.label}
                  onPress={action.onPress}
                  variant={action.variant ?? 'primary'}
                  fullWidth
                />
              ))}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
