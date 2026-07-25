import React, { useState, useEffect } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { PencilSimple, Trash, X, ShareNetwork } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';
import { NBButton, useToast } from '../ui';
import { usePostStore } from '../../store/postStore';
import { OutfitPost } from '../../types/post';

import { useAuthStore } from '../../store/authStore';

interface PostActionMenuProps {
  post: OutfitPost | null;
  visible: boolean;
  onDismiss: () => void;
}

export function PostActionMenu({ post, visible, onDismiss }: PostActionMenuProps) {
  const showToast = useToast();
  const editPost = usePostStore((s) => s.editPost);
  const deletePost = usePostStore((s) => s.deletePost);
  const me = useAuthStore((s) => s.user);

  const isMyPost = Boolean(me && post && post.author?.username === me.username);

  const [isEditing, setIsEditing] = useState(false);
  const [newCaption, setNewCaption] = useState('');

  useEffect(() => {
    if (post) {
      setNewCaption(post.caption ?? '');
    }
    setIsEditing(false);
  }, [post, visible]);

  if (!post) return null;

  function handleSaveEdit() {
    if (!post) return;
    editPost(post.id, newCaption.trim());
    showToast('Post caption updated! ✏️', 'success');
    setIsEditing(false);
    onDismiss();
  }

  function handleDelete() {
    if (!post) return;
    deletePost(post.id);
    showToast('Post deleted 🗑️', 'info');
    onDismiss();
  }

  function handleShare() {
    showToast('Post link copied to clipboard! 🔗', 'success');
    onDismiss();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: radii.bento,
            borderTopRightRadius: radii.bento,
            padding: 20,
            gap: 16,
            borderWidth: 1,
            borderColor: colors.bentoBorder,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.black }}>
              {isEditing ? 'Edit Post Caption' : 'Post Options'}
            </Text>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <X color={colors.black} size={20} weight="bold" />
            </Pressable>
          </View>

          {isEditing ? (
            <View style={{ gap: 12 }}>
              <TextInput
                value={newCaption}
                onChangeText={setNewCaption}
                multiline
                placeholder="Write a caption…"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: colors.paper,
                  borderRadius: 16,
                  padding: 14,
                  fontFamily: 'SpaceGrotesk-Medium',
                  fontSize: 14,
                  color: colors.black,
                  minHeight: 90,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <NBButton label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setIsEditing(false)} />
                <NBButton label="Save Changes" variant="primary" style={{ flex: 1 }} onPress={handleSaveEdit} />
              </View>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {/* Edit Option (Owner only) */}
              {isMyPost && (
                <Pressable
                  onPress={() => setIsEditing(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: colors.paper,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.bentoBorder,
                  }}
                >
                  <View style={{ backgroundColor: colors.bentoLavender, padding: 8, borderRadius: 9999 }}>
                    <PencilSimple color={colors.bentoPurple} size={18} weight="bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                      Edit Post Caption
                    </Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
                      Update the caption and hashtags for this outfit
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* Share Option */}
              <Pressable
                onPress={handleShare}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: colors.paper,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.bentoBorder,
                }}
              >
                <View style={{ backgroundColor: colors.bentoMintLight, padding: 8, borderRadius: 9999 }}>
                  <ShareNetwork color={colors.bentoMint} size={18} weight="bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
                    Share Outfit Link
                  </Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#6B7280' }}>
                    Copy link to share on social networks
                  </Text>
                </View>
              </Pressable>

              {/* Delete Option (Owner only) */}
              {isMyPost && (
                <Pressable
                  onPress={handleDelete}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: colors.bentoRoseSoft,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#FECDD3',
                  }}
                >
                  <View style={{ backgroundColor: '#FFE4E6', padding: 8, borderRadius: 9999 }}>
                    <Trash color="#E11D48" size={18} weight="bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: '#E11D48' }}>
                      Delete Post
                    </Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#BE185D' }}>
                      Permanently remove this outfit post from feed
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
