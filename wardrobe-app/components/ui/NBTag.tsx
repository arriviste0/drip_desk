import React, { useState } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../../lib/theme';

interface NBTagProps {
  label: string;
  price?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

const DOT = 16;
const PILL_W = 145;
const PILL_H = 32;
const SPRING = { damping: 16, stiffness: 240 };

export function NBTag({ label, price, onPress, style }: NBTagProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    width: withSpring(DOT + progress.value * (PILL_W - DOT), SPRING),
    height: withSpring(DOT + progress.value * (PILL_H - DOT), SPRING),
    borderRadius: 9999,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: withSpring(progress.value, SPRING),
  }));

  function toggle() {
    const next = !isExpanded;
    progress.value = next ? 1 : 0;
    setIsExpanded(next);
    if (next) onPress?.();
  }

  return (
    <Animated.View
      style={[
        {
          backgroundColor: 'rgba(24, 24, 27, 0.88)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
        containerStyle,
        style,
      ]}
    >
      <Pressable
        onPress={toggle}
        style={{ paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              fontFamily: 'SpaceGrotesk-Bold',
              fontSize: 10,
              color: colors.white,
              letterSpacing: 0.5,
            },
            textStyle,
          ]}
        >
          {`${label}${price !== undefined ? ' · $' + price : ''}`}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}
