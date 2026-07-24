import { View, Text } from 'react-native';
import { colors } from '../../lib/theme';

export default function Create() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 24, color: colors.white }}>
        CREATE
      </Text>
      <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#555', marginTop: 8 }}>
        Coming in a future session
      </Text>
    </View>
  );
}
