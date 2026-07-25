import React, { useState, useEffect } from 'react';
import { Dimensions, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, PaperPlaneRight, Heart, Sparkle } from 'phosphor-react-native';
import { NBAvatar, useToast } from '../ui';
import { colors } from '../../lib/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface StoryUser {
  id: string;
  username: string;
  avatarUrl?: string;
  stories?: Array<{ id: string; image: string; caption?: string; timeAgo?: string }>;
}

interface StoryViewerModalProps {
  user: StoryUser | null;
  visible: boolean;
  onDismiss: () => void;
}

const DEFAULT_STORY_SLIDES = [
  { id: 's1', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700', caption: 'OOTD Tokyo Streetwear Fit 🖤', timeAgo: '2h ago' },
  { id: 's2', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=700', caption: 'Night Drip Aesthetic ✨', timeAgo: '5h ago' },
  { id: 's3', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=700', caption: 'Minimalist Coffee Run Capsule ☕', timeAgo: '8h ago' },
];

export function StoryViewerModal({ user, visible, onDismiss }: StoryViewerModalProps) {
  const { top, bottom } = useSafeAreaInsets();
  const showToast = useToast();
  const [slideIndex, setSlideIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const slides = user?.stories?.length ? user.stories : DEFAULT_STORY_SLIDES;
  const currentSlide = slides[slideIndex] ?? slides[0];

  useEffect(() => {
    if (visible) {
      setSlideIndex(0);
      setIsLiked(false);
      setReplyText('');
    }
  }, [visible, user]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (slideIndex < slides.length - 1) {
        setSlideIndex((prev) => prev + 1);
      } else {
        onDismiss();
      }
    }, 5000); // 5 seconds per slide
    return () => clearTimeout(timer);
  }, [visible, slideIndex, slides.length, onDismiss]);

  if (!visible || !user) return null;

  function handleSendReply() {
    if (!replyText.trim()) return;
    showToast(`Replied to @${user?.username}'s story! 💬`, 'success');
    setReplyText('');
  }

  function handleTapScreen(evt: any) {
    const x = evt.nativeEvent.locationX;
    if (x < SCREEN_W / 3) {
      // Tap left -> Previous slide
      if (slideIndex > 0) setSlideIndex((prev) => prev - 1);
    } else {
      // Tap right -> Next slide
      if (slideIndex < slides.length - 1) {
        setSlideIndex((prev) => prev + 1);
      } else {
        onDismiss();
      }
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Pressable onPress={handleTapScreen} style={{ flex: 1 }}>
          <Image
            source={{ uri: currentSlide.image }}
            style={{ width: SCREEN_W, height: SCREEN_H }}
            contentFit="cover"
          />

          {/* Top Overlay Header */}
          <View
            style={{
              position: 'absolute',
              top: Math.max(top, 16),
              left: 16,
              right: 16,
              gap: 10,
            }}
          >
            {/* Progress Bars */}
            <View style={{ flexDirection: 'row', gap: 4, height: 3 }}>
              {slides.map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: idx === slideIndex ? '#FFF' : idx < slideIndex ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </View>

            {/* Author Strip */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <NBAvatar uri={user.avatarUrl} size="sm" isVerified />
                <View>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.white }}>
                    @{user.username}
                  </Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    {currentSlide.timeAgo ?? '2h ago'}
                  </Text>
                </View>
              </View>

              <Pressable onPress={onDismiss} hitSlop={12} style={{ padding: 6, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <X color={colors.white} size={20} weight="bold" />
              </Pressable>
            </View>
          </View>

          {/* Caption Overlay */}
          {currentSlide.caption ? (
            <View
              style={{
                position: 'absolute',
                bottom: Math.max(bottom, 75) + 60,
                left: 16,
                right: 16,
                padding: 14,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: colors.white, lineHeight: 20 }}>
                {currentSlide.caption}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {/* Bottom Reaction & Reply Input Bar */}
        <View
          style={{
            position: 'absolute',
            bottom: Math.max(bottom, 16),
            left: 16,
            right: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TextInput
            placeholder={`Send message to @${user.username}…`}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={replyText}
            onChangeText={setReplyText}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 9999,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: 'SpaceGrotesk-Medium',
              fontSize: 13,
              color: colors.white,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          />
          {replyText.trim().length > 0 ? (
            <Pressable
              onPress={handleSendReply}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PaperPlaneRight color={colors.black} size={20} weight="bold" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setIsLiked(!isLiked);
                showToast(isLiked ? 'Unliked story' : 'Sent story reaction ❤️', 'success');
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              <Heart color={isLiked ? '#EC4899' : colors.white} size={22} weight={isLiked ? 'fill' : 'regular'} />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
