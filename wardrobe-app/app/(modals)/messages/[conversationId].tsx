import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Conversation() {
  const { conversationId } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Conversation: {conversationId}</Text>
    </View>
  );
}
