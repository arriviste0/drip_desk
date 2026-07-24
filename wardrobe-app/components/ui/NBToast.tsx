import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { create } from 'zustand';
import { Check, Info, WarningCircle } from 'phosphor-react-native';
import { colors } from '../../lib/theme';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  variant: 'info',
  show: (message, variant = 'info') => set({ visible: true, message, variant }),
  hide: () => set({ visible: false }),
}));

export function useToast() {
  return useToastStore((s) => s.show);
}

const ACCENT_BG: Record<ToastVariant, string> = {
  success: '#DCFCE7',
  error: colors.bentoRoseSoft,
  info: colors.bentoLavender,
};

const ACCENT_ICON: Record<ToastVariant, React.ReactNode> = {
  success: <Check color={colors.bentoSuccessGreen} size={16} weight="bold" />,
  error: <WarningCircle color="#BE185D" size={16} weight="bold" />,
  info: <Info color={colors.bentoPurple} size={16} weight="bold" />,
};

const TOP = Platform.OS === 'ios' ? 56 : 36;

export function NBToast() {
  const { visible, message, variant, hide } = useToastStore();
  const translateY = useSharedValue(-120);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 250 });
        setTimeout(hide, 270);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: TOP,
          left: 16,
          right: 16,
          zIndex: 9999,
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          borderRadius: 9999,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 10,
        },
        animStyle,
      ]}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: ACCENT_BG[variant],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ACCENT_ICON[variant]}
      </View>
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 13,
          color: colors.white,
          letterSpacing: -0.2,
          flex: 1,
        }}
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
