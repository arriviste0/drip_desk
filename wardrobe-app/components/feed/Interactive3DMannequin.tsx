import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Sparkle, Cube, ArrowClockwise, ShirtFolded, CoatHanger } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';

interface Interactive3DMannequinProps {
  height: number;
  width: number;
  tags?: Array<{ id: string; name?: string; price?: number }>;
}

export function Interactive3DMannequin({ height, width, tags = [] }: Interactive3DMannequinProps) {
  const rotationY = useSharedValue(0);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      rotationY.value = e.translationX * 0.5;
    })
    .onEnd(() => {
      rotationY.value = withSpring(0, { damping: 15 });
    });

  const mannequinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotationY.value}deg` },
      { perspective: 1000 },
    ],
  }));

  function resetRotation() {
    rotationY.value = withSpring(0);
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { width, height }]}>
        {/* Background 3D Grid */}
        <View style={styles.gridOverlay}>
          <View style={styles.gridRingOuter} />
          <View style={styles.gridRingInner} />
        </View>

        {/* 3D Mannequin Body Canvas */}
        <Animated.View style={[styles.mannequinBody, mannequinAnimatedStyle]}>
          {/* Head Sphere */}
          <View style={styles.headNode}>
            <Sparkle color={colors.bentoPurple} size={16} weight="fill" />
          </View>

          {/* Torso & Outerwear Block */}
          <Pressable
            onPress={() => setSelectedLayer('Outerwear & Top')}
            style={[
              styles.torsoBlock,
              selectedLayer === 'Outerwear & Top' && styles.selectedBlock,
            ]}
          >
            <View style={styles.garmentPill}>
              <ShirtFolded color={colors.white} size={14} weight="bold" />
              <Text style={styles.garmentText}>Outerwear / Top</Text>
            </View>
          </Pressable>

          {/* Waist & Trousers Block */}
          <Pressable
            onPress={() => setSelectedLayer('Bottoms & Trousers')}
            style={[
              styles.bottomsBlock,
              selectedLayer === 'Bottoms & Trousers' && styles.selectedBlock,
            ]}
          >
            <View style={styles.garmentPillAlt}>
              <CoatHanger color={colors.black} size={14} weight="bold" />
              <Text style={styles.garmentTextAlt}>Trousers / Bottoms</Text>
            </View>
          </Pressable>

          {/* Footwear Base Block */}
          <Pressable
            onPress={() => setSelectedLayer('Sneakers & Footwear')}
            style={[
              styles.shoesBlock,
              selectedLayer === 'Sneakers & Footwear' && styles.selectedBlock,
            ]}
          >
            <View style={styles.shoesPill}>
              <Text style={styles.shoesText}>Sneakers / Footwear</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* 3D Controls Bar */}
        <View style={styles.controlsBar}>
          <View style={styles.controlsBadge}>
            <Cube color={colors.bentoPurple} size={14} weight="bold" />
            <Text style={styles.controlsBadgeText}>3D Mannequin • 360° Drag to Rotate</Text>
          </View>
          <Pressable onPress={resetRotation} style={styles.resetBtn}>
            <ArrowClockwise color={colors.black} size={14} weight="bold" />
          </Pressable>
        </View>

        {/* Selected Layer Toast Overlay */}
        {selectedLayer && (
          <View style={styles.selectedToast}>
            <Text style={styles.selectedToastTitle}>{selectedLayer}</Text>
            <Text style={styles.selectedToastSub}>3D Garment Mesh Layer • Tap to view specs</Text>
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRingOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  gridRingInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(110,86,207,0.15)',
  },
  mannequinBody: {
    alignItems: 'center',
    gap: 8,
  },
  headNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: colors.bentoPurple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.bentoPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  torsoBlock: {
    width: 140,
    height: 120,
    borderRadius: 24,
    backgroundColor: 'rgba(110, 86, 207, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(110, 86, 207, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  bottomsBlock: {
    width: 110,
    height: 130,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 114, 182, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 114, 182, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  shoesBlock: {
    width: 120,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(209, 242, 217, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBlock: {
    borderColor: colors.white,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  garmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  garmentText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: colors.white,
  },
  garmentPillAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  garmentTextAlt: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: colors.black,
  },
  shoesPill: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  shoesText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 9,
    color: '#D1F2D9',
  },
  controlsBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  controlsBadgeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: colors.black,
  },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 8,
    borderRadius: 9999,
  },
  selectedToast: {
    position: 'absolute',
    bottom: 14,
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  selectedToastTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: colors.white,
  },
  selectedToastSub: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 1,
  },
});
