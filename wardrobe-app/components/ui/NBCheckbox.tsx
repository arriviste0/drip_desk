import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Check } from 'phosphor-react-native';
import { colors } from '../../lib/theme';

interface NBCheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}

export function NBCheckbox({ checked, onPress, label, disabled = false }: NBCheckboxProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(pressed.value * 3, { duration: 60 }) },
      { translateY: withTiming(pressed.value * 3, { duration: 60 }) },
    ],
    shadowOffset: {
      width: withTiming((1 - pressed.value) * 3, { duration: 60 }),
      height: withTiming((1 - pressed.value) * 3, { duration: 60 }),
    },
  }));

  return (
    <Pressable
      onPressIn={() => { if (!disabled) pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={disabled ? undefined : onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: 26,
            height: 26,
            backgroundColor: checked ? colors.yellow : colors.white,
            borderWidth: 3,
            borderColor: colors.black,
            borderRadius: 0,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.black,
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3,
          },
          animStyle,
        ]}
      >
        {checked ? <Check color={colors.black} size={14} weight="bold" /> : null}
      </Animated.View>
      {label ? (
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 13,
            color: colors.black,
            letterSpacing: 1,
            textTransform: 'uppercase',
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
