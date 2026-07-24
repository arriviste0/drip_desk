import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { colors } from '../../lib/theme';

export interface NBRadioOption<T extends string = string> {
  label: string;
  value: T;
}

interface NBRadioGroupProps<T extends string = string> {
  options: NBRadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  direction?: 'row' | 'column';
}

function NBRadioItem({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: selected ? colors.bentoPurple : colors.paper,
          borderWidth: 1,
          borderColor: selected ? colors.bentoPurple : colors.bentoBorder,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <Check color={colors.white} size={14} weight="bold" /> : null}
      </View>
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 14,
          color: colors.black,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function NBRadioGroup<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  direction = 'column',
}: NBRadioGroupProps<T>) {
  return (
    <View style={{ flexDirection: direction, gap: 12, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <NBRadioItem
          key={opt.value}
          label={opt.label}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}
