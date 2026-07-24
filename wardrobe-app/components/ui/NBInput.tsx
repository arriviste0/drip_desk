import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors } from '../../lib/theme';

interface NBInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  multiline?: boolean;
  style?: ViewStyle;
}

export function NBInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect = false,
  multiline = false,
  style,
}: NBInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label ? (
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Bold',
            fontSize: 12,
            color: colors.black,
            marginBottom: 6,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1.5,
          borderColor: error ? colors.red : focused ? colors.black : colors.bentoBorder,
          borderRadius: 16,
          backgroundColor: colors.white,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontFamily: 'SpaceGrotesk-Medium',
            fontSize: 14,
            color: colors.black,
            paddingVertical: 12,
            paddingHorizontal: 16,
            minHeight: multiline ? 90 : undefined,
            textAlignVertical: multiline ? 'top' : 'auto',
          }}
        />
      </View>

      {error ? (
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Medium',
            fontSize: 11,
            color: colors.red,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
