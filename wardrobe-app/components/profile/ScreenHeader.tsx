import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft } from 'phosphor-react-native';
import { colors } from '../../lib/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/** Unified Bento top navigation bar with back button pill and unified title styling. */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.bentoBorder,
      }}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: colors.bentoBorder,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CaretLeft color={colors.black} size={20} weight="bold" />
      </Pressable>

      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 18,
          color: colors.black,
          letterSpacing: -0.4,
          flex: 1,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={{ width: 36, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
