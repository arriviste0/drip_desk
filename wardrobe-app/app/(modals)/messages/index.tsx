import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft, MagnifyingGlass, PaperPlaneRight, Sparkle } from 'phosphor-react-native';
import { NBAvatar, NBBadge, NBCard, NBEmptyState } from '../../../components/ui';
import { colors, radii } from '../../../lib/theme';

interface ConversationThread {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'nova_fits',
    username: 'nova_fits',
    displayName: 'Nova Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
    lastMessage: 'Hey! Love your latest streetwear fit post 🔥',
    time: '10:14 AM',
    unread: true,
  },
  {
    id: 'chloe_styles',
    username: 'chloe_styles',
    displayName: 'Chloe Bennett',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600',
    lastMessage: 'Where did you get that vintage jacket?',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'kai_streetwear',
    username: 'kai_streetwear',
    displayName: 'Kai Sato',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
    lastMessage: 'Let us collaborate on a capsule lookbook!',
    time: '2 days ago',
    unread: false,
  },
];

export default function MessagesInboxScreen() {
  const { top } = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);

  const filteredConversations = conversations.filter(
    (c) =>
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: top + 6,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.bentoBorder,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <CaretLeft color={colors.black} size={22} weight="bold" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
            Direct Messages
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={{ padding: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.white,
            borderRadius: 9999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
            gap: 10,
          }}
        >
          <MagnifyingGlass color="#9CA3AF" size={18} weight="bold" />
          <TextInput
            placeholder="Search messages or creators…"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontFamily: 'SpaceGrotesk-Medium',
              fontSize: 14,
              color: colors.black,
            }}
          />
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, gap: 10 }} showsVerticalScrollIndicator={false}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map((item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: '/(modals)/messages/[conversationId]',
                  params: { conversationId: item.username },
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: radii.bento,
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: item.unread ? colors.bentoPurple : colors.bentoBorder,
              }}
            >
              <NBAvatar uri={item.avatarUrl} size="md" />

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                    @{item.username}
                  </Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#9CA3AF' }}>
                    {item.time}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: item.unread ? 'SpaceGrotesk-Bold' : 'SpaceGrotesk-Medium',
                    fontSize: 13,
                    color: item.unread ? colors.black : '#6B7280',
                    marginTop: 3,
                  }}
                >
                  {item.lastMessage}
                </Text>
              </View>

              {item.unread && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.bentoPurple }} />
              )}
            </Pressable>
          ))
        ) : (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <NBEmptyState
              icon={<PaperPlaneRight color={colors.bentoPurple} size={36} weight="bold" />}
              title="No messages found"
              body="Start a conversation with a creator from their profile!"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
