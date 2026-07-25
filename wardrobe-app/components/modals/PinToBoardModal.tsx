import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { BookmarkSimple, Plus, X, Check } from 'phosphor-react-native';
import { useMoodboardStore } from '../../store/moodboardStore';
import { useToast } from '../ui';
import { colors, radii } from '../../lib/theme';

interface PinToBoardModalProps {
  visible: boolean;
  itemId?: string;
  itemImage?: string;
  itemTitle?: string;
  onDismiss: () => void;
}

export function PinToBoardModal({
  visible,
  itemId,
  itemImage,
  itemTitle,
  onDismiss,
}: PinToBoardModalProps) {
  const showToast = useToast();
  const boards = useMoodboardStore((s) => s.boards);
  const createBoard = useMoodboardStore((s) => s.createBoard);
  const pinToBoard = useMoodboardStore((s) => s.pinToBoard);

  const [newBoardName, setNewBoardName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  if (!visible) return null;

  function handleSelectBoard(boardId: string, boardName: string) {
    if (!itemId) return;
    pinToBoard(boardId, itemId, itemImage);
    showToast(`Pinned to "${boardName}"! 📌`, 'success');
    onDismiss();
  }

  function handleCreateAndPin() {
    if (!newBoardName.trim()) return;
    const board = createBoard(newBoardName.trim(), itemId, itemImage);
    showToast(`Created "${board.name}" & Pinned! 📌`, 'success');
    setNewBoardName('');
    setShowCreate(false);
    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '80%', gap: 16 }}>
          {/* Top Bar Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BookmarkSimple color={colors.bentoPurple} size={22} weight="fill" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
                Pin to Moodboard
              </Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8} style={{ padding: 6, borderRadius: 9999, backgroundColor: colors.paper }}>
              <X color={colors.black} size={18} weight="bold" />
            </Pressable>
          </View>

          {/* Item Preview Badge */}
          {itemImage && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.paper }}>
              <Image source={{ uri: itemImage }} style={{ width: 44, height: 44, borderRadius: 10 }} contentFit="cover" />
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>
                {itemTitle || 'Outfit Pin'}
              </Text>
            </View>
          )}

          {/* Board List */}
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {boards.map((b) => {
              const isPinned = itemId ? b.savedItemIds.includes(itemId) : false;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => handleSelectBoard(b.id, b.name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: colors.paper,
                    borderWidth: 1,
                    borderColor: isPinned ? colors.bentoPurple : colors.bentoBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image source={{ uri: b.coverImage }} style={{ width: 40, height: 40, borderRadius: 10 }} contentFit="cover" />
                    <View>
                      <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                        {b.name}
                      </Text>
                      <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
                        {b.itemCount} pins
                      </Text>
                    </View>
                  </View>
                  {isPinned ? (
                    <View style={{ backgroundColor: colors.bentoLavender, padding: 6, borderRadius: 9999 }}>
                      <Check color={colors.bentoPurple} size={16} weight="bold" />
                    </View>
                  ) : (
                    <View style={{ backgroundColor: colors.black, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                      <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, color: colors.white }}>Pin</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Create New Board Accordion */}
          {!showCreate ? (
            <Pressable
              onPress={() => setShowCreate(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 14,
                borderRadius: 9999,
                backgroundColor: colors.bentoLavender,
                borderWidth: 1,
                borderColor: colors.bentoBorder,
              }}
            >
              <Plus color={colors.bentoPurple} size={18} weight="bold" />
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.bentoPurple }}>
                Create New Moodboard
              </Text>
            </Pressable>
          ) : (
            <View style={{ gap: 10, paddingTop: 4 }}>
              <TextInput
                placeholder="Board name (e.g. Vintage Summer Fits)"
                placeholderTextColor="#9CA3AF"
                value={newBoardName}
                onChangeText={setNewBoardName}
                autoFocus
                style={{
                  backgroundColor: colors.paper,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 14,
                  color: colors.black,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setShowCreate(false)}
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9999, backgroundColor: colors.paper }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.black }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateAndPin}
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9999, backgroundColor: colors.black }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: colors.white }}>Create & Pin</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default PinToBoardModal;
