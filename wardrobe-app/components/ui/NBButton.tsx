import React from 'react';
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii } from '../../lib/theme';

export type NBButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';

interface NBButtonProps {
  label: string;
  onPress?: () => void;
  variant?: NBButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const BG: Record<NBButtonVariant, string> = {
  primary:   colors.black,
  secondary: colors.white,
  ghost:     'transparent',
  danger:    colors.red,
  ai:        colors.bentoLavender,
};

const BORDER: Record<NBButtonVariant, string> = {
  primary:   'transparent',
  secondary: colors.bentoBorder,
  ghost:     'transparent',
  danger:    'transparent',
  ai:        'transparent',
};

const TEXT_COLOR: Record<NBButtonVariant, string> = {
  primary:   colors.white,
  secondary: colors.black,
  ghost:     colors.black,
  danger:    colors.white,
  ai:        colors.bentoPurple,
};

export function NBButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: NBButtonProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.96 : 1, { damping: 15, stiffness: 200 }) },
    ],
  }));

  return (
    <Pressable
      onPressIn={() => { if (!disabled && !loading) pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={disabled || loading ? undefined : onPress}
      style={[fullWidth && { width: '100%' }, style]}
    >
      <Animated.View
        style={[
          {
            backgroundColor: BG[variant],
            borderWidth: variant === 'secondary' ? 1 : 0,
            borderColor: BORDER[variant],
            borderRadius: radii.pill,
            paddingVertical: 14,
            paddingHorizontal: 22,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0 : 0.08,
            shadowRadius: 10,
            elevation: disabled ? 0 : 3,
            opacity: disabled ? 0.4 : 1,
          },
          animStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={TEXT_COLOR[variant]} size="small" />
        ) : (
          <Text
            style={{
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 14,
              color: TEXT_COLOR[variant],
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
