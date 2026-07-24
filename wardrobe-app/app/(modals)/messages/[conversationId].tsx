import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft, PaperPlaneRight, Sparkle } from 'phosphor-react-native';
import { NBAvatar, useToast } from '../../../components/ui';
import { colors, radii } from '../../../lib/theme';

interface MessageItem {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const targetUsername = String(conversationId ?? 'creator');
  const { top } = useSafeAreaInsets();
  const showToast = useToast();

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([
    { id: 'm1', sender: 'them', text: `Hey! Love your outfit posts on Drip Deck 🔥`, time: '10:14 AM' },
    { id: 'm2', sender: 'me', text: `Thanks! Appreciate it! Where did you get that leather jacket from?`, time: '10:16 AM' },
    { id: 'm3', sender: 'them', text: `It's vintage Oak & Fort! Tagged it in my latest look 🧥`, time: '10:18 AM' },
  ]);

  function handleSendMessage() {
    if (!messageText.trim()) return;
    const newMsg: MessageItem = {
      id: 'msg_' + Date.now(),
      sender: 'me',
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessageText('');
    showToast('Message sent! 💬', 'success');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Direct Messaging Top Header */}
      <View
        style={{
          paddingTop: top + 6,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
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

        <Pressable
          onPress={() => router.push({ pathname: '/(modals)/user-profile/[username]', params: { username: targetUsername } })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
        >
          <NBAvatar uri={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600`} size="sm" isVerified />
          <View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
              @{targetUsername}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bentoMint }} />
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
                Active on Drip Deck
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Message Thread Scroll View */}
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => {
          const isMe = m.sender === 'me';
          return (
            <View
              key={m.id}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                backgroundColor: isMe ? colors.black : colors.white,
                borderRadius: 18,
                borderBottomRightRadius: isMe ? 4 : 18,
                borderBottomLeftRadius: isMe ? 18 : 4,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: isMe ? 0 : 1,
                borderColor: colors.bentoBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 14,
                  color: isMe ? colors.white : colors.black,
                  lineHeight: 20,
                }}
              >
                {m.text}
              </Text>
              <Text
                style={{
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 10,
                  color: isMe ? '#9CA3AF' : '#9CA3AF',
                  marginTop: 4,
                  alignSelf: 'flex-end',
                }}
              >
                {m.time}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Interactive Message Input Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.bentoBorder,
          gap: 10,
        }}
      >
        <TextInput
          placeholder={`Message @${targetUsername}…`}
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={setMessageText}
          style={{
            flex: 1,
            backgroundColor: colors.paper,
            borderRadius: 9999,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontFamily: 'SpaceGrotesk-Medium',
            fontSize: 14,
            color: colors.black,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
          }}
        />
        <Pressable
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: messageText.trim() ? colors.black : '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PaperPlaneRight color={colors.white} size={18} weight="bold" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
