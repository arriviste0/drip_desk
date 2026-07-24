import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { CaretDown, Check } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';

export interface NBSelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface NBSelectProps<T extends string = string> {
  options: NBSelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function NBSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  disabled = false,
}: NBSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  const selected = options.find((o) => o.value === value);

  const openSheet = () => {
    if (disabled) return;
    setOpen(true);
    opacity.value = withTiming(1, { duration: 120 });
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
  };

  const closeSheet = () => {
    opacity.value = withTiming(0, { duration: 80 });
    scale.value = withTiming(0.95, { duration: 80 });
    setTimeout(() => setOpen(false), 90);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View>
      {label ? (
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 12,
            color: colors.black,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={openSheet}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          borderRadius: radii.bento,
          paddingVertical: 14,
          paddingHorizontal: 14,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Medium',
            fontSize: 14,
            color: selected ? colors.black : '#9CA3AF',
            flex: 1,
          }}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <CaretDown color={colors.black} size={18} weight="bold" />
      </Pressable>

      <Modal transparent visible={open} onRequestClose={closeSheet} animationType="none">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
              },
              backdropStyle,
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={closeSheet} />
          </Animated.View>

          <Animated.View
            style={[
              {
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.bentoBorder,
                borderRadius: radii.bento,
                width: '88%',
                maxHeight: '60%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.12,
                shadowRadius: 20,
                elevation: 8,
                overflow: 'hidden',
              },
              sheetStyle,
            ]}
          >
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.bentoBorder,
                padding: 16,
                backgroundColor: colors.white,
              }}
            >
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Bold',
                  fontSize: 16,
                  color: colors.black,
                }}
              >
                {label ?? placeholder}
              </Text>
            </View>

            <ScrollView>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => { onChange(opt.value); closeSheet(); }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.bentoBorder,
                      backgroundColor: pressed ? colors.paper : isSelected ? colors.bentoLavender : colors.white,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: 'SpaceGrotesk-Bold',
                        fontSize: 14,
                        color: colors.black,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {isSelected ? <Check color={colors.bentoPurple} size={18} weight="bold" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
