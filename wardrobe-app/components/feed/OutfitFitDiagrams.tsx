import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Palette, Rows, ChartPie, TrendUp, ShieldCheck } from 'phosphor-react-native';
import { colors, radii } from '../../lib/theme';

interface OutfitFitDiagramsProps {
  height: number;
  width: number;
  tags?: Array<{ id: string; name?: string; price?: number }>;
}

export function OutfitFitDiagrams({ height, width, tags = [] }: OutfitFitDiagramsProps) {
  const COLOR_PALETTE = [
    { name: 'Onyx Black', hex: '#18181B', pct: '50%', color: colors.white },
    { name: 'Cream Knit', hex: '#F5F2EB', pct: '30%', color: colors.black },
    { name: 'Sage Olive', hex: '#556B2F', pct: '20%', color: colors.white },
  ];

  const LAYERS_MAP = [
    { stage: 'Outer Layer', item: tags[0]?.name ?? 'Vintage Leather Bomber', cpw: '₹140/wear', bg: colors.bentoLavender, color: colors.bentoPurple },
    { stage: 'Mid / Base Layer', item: tags[1]?.name ?? 'Cashmere Knit Sweater', cpw: '₹95/wear', bg: colors.bentoBlush, color: '#EC4899' },
    { stage: 'Bottoms', item: tags[2]?.name ?? 'Cargo Parachute Pants', cpw: '₹60/wear', bg: colors.bentoMintLight, color: colors.bentoMint },
    { stage: 'Footwear & Accs', item: 'Retro Sneakers & Cyber Glasses', cpw: '₹40/wear', bg: colors.bentoYellow, color: '#B45309' },
  ];

  return (
    <View style={[styles.container, { width, height }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.diagramHeader}>
          <ChartPie color={colors.bentoPurple} size={18} weight="bold" />
          <Text style={styles.headerTitle}>Outfit Analytics & Fit Diagrams</Text>
        </View>

        {/* Diagram 1: Color Palette Swatches */}
        <View style={styles.diagramCard}>
          <View style={styles.cardTitleRow}>
            <Palette color={colors.black} size={16} weight="bold" />
            <Text style={styles.cardTitle}>Color Palette & Proportions</Text>
          </View>

          {/* Color swatch bar */}
          <View style={styles.swatchBar}>
            {COLOR_PALETTE.map((c, i) => (
              <View key={i} style={[styles.swatchSegment, { backgroundColor: c.hex, flex: parseInt(c.pct) }]} />
            ))}
          </View>

          {/* Color breakdown chips */}
          <View style={styles.chipsRow}>
            {COLOR_PALETTE.map((c, i) => (
              <View key={i} style={[styles.colorChip, { backgroundColor: c.hex }]}>
                <Text style={[styles.colorChipText, { color: c.color }]}>
                  {c.name} • {c.pct}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Diagram 2: Silhouette & Formality Meter */}
        <View style={styles.diagramCard}>
          <View style={styles.cardTitleRow}>
            <TrendUp color={colors.black} size={16} weight="bold" />
            <Text style={styles.cardTitle}>Silhouette & Fit Balance</Text>
          </View>

          <View style={styles.balanceContainer}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Oversized Top</Text>
              <Text style={styles.balanceValue}>65%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '65%', backgroundColor: colors.bentoPurple }]} />
            </View>

            <View style={[styles.balanceRow, { marginTop: 10 }]}>
              <Text style={styles.balanceLabel}>Tapered Bottoms</Text>
              <Text style={styles.balanceValue}>35%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '35%', backgroundColor: '#EC4899' }]} />
            </View>
          </View>
        </View>

        {/* Diagram 3: Garment Layering Blueprint & CPW Rating */}
        <View style={styles.diagramCard}>
          <View style={styles.cardTitleRow}>
            <Rows color={colors.black} size={16} weight="bold" />
            <Text style={styles.cardTitle}>Garment Layer Blueprint & CPW</Text>
          </View>

          <View style={styles.layersList}>
            {LAYERS_MAP.map((l, i) => (
              <View key={i} style={[styles.layerRow, { backgroundColor: l.bg }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.layerStage, { color: l.color }]}>{l.stage}</Text>
                  <Text style={styles.layerItem}>{l.item}</Text>
                </View>
                <View style={styles.cpwBadge}>
                  <ShieldCheck color={colors.black} size={12} weight="bold" />
                  <Text style={styles.cpwText}>{l.cpw}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.paper,
    padding: 12,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  diagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: radii.bento,
    borderWidth: 1,
    borderColor: colors.bentoBorder,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
    color: colors.black,
  },
  diagramCard: {
    backgroundColor: colors.white,
    borderRadius: radii.bento,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.bentoBorder,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
    color: colors.black,
  },
  swatchBar: {
    height: 18,
    borderRadius: 9999,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 4,
  },
  swatchSegment: {
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  colorChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  colorChipText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
  },
  balanceContainer: {
    gap: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  balanceLabel: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 11,
    color: '#4B5563',
  },
  balanceValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 11,
    color: colors.black,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  layersList: {
    gap: 8,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
  },
  layerStage: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  layerItem: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: colors.black,
    marginTop: 1,
  },
  cpwBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  cpwText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: colors.black,
  },
});
