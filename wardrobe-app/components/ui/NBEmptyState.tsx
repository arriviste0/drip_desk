import React from 'react';
import { Text, View } from 'react-native';
import { NBButton } from './NBButton';
import { colors } from '../../lib/theme';

interface NBEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  cta?: string;
  onCta?: () => void;
}

export function NBEmptyState({ icon, title, body, cta, onCta }: NBEmptyStateProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      {icon ? (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.bentoLavender,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {icon}
        </View>
      ) : null}

      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: 20,
          color: colors.black,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>

      {body ? (
        <Text
          style={{
            fontFamily: 'SpaceGrotesk-Medium',
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          {body}
        </Text>
      ) : null}

      {cta && onCta ? (
        <NBButton label={cta} onPress={onCta} variant="primary" />
      ) : null}
    </View>
  );
}
