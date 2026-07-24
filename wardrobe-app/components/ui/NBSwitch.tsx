import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../../lib/theme';

interface NBSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function NBSwitch({ value, onValueChange, label, disabled = false }: NBSwitchProps) {
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withSpring(value ? 20 : 0, { damping: 18, stiffness: 220 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={{
          width: 48,
          height: 28,
          backgroundColor: value ? colors.bentoPurple : '#E5E7EB',
          borderRadius: 14,
          padding: 3,
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              width: 22,
              height: 22,
              backgroundColor: colors.white,
              borderRadius: 11,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            },
            thumbStyle,
          ]}
        />
      </View>
      {label ? (
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 14,
            color: colors.black,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
