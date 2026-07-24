import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../../lib/theme';

interface NBChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function NBChip({ label, selected, onPress }: NBChipProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 80 }) }],
  }));

  return (
    <Pressable
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            backgroundColor: selected ? colors.yellow : colors.white,
            borderWidth: selected ? 0 : 1,
            borderColor: '#E0DDD6',
            borderRadius: 99,
            paddingVertical: 8,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOpacity: selected ? 0 : 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: selected ? 0 : 2,
          },
          animStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 12,
            color: selected ? colors.black : '#666',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
