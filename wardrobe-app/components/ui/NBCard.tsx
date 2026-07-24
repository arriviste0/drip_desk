import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii } from '../../lib/theme';

interface NBCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function NBCard({ children, onPress, style }: NBCardProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.97 : 1, { damping: 15, stiffness: 200 }) },
    ],
  }));

  const baseStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.bentoBorder,
    borderRadius: radii.bento,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  };

  if (!onPress) {
    return (
      <Animated.View style={[baseStyle, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Pressable
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={onPress}
    >
      <Animated.View style={[baseStyle, animStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
