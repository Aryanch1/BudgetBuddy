import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from './ui';
import { money } from '../lib/coach';
import { CATEGORY_GLYPHS, CATEGORY_LABELS, type Expense } from '../lib/types';
import { categoryColors, palette, spacing, type } from '../lib/theme';

/** One expense row — category glyph chip, note, date, amount. */
export function ExpenseCard({
  expense,
  index = 0,
  selected = false,
  demo = false,
}: {
  expense: Expense;
  index?: number;
  selected?: boolean;
  demo?: boolean;
}) {
  const color = categoryColors[expense.category] ?? palette.primary;
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <GlassCard style={[styles.card, selected && styles.cardSelected]}>
        <View style={[styles.glyph, { backgroundColor: `${color}1F` }]}>
          <Text style={styles.glyphText}>{CATEGORY_GLYPHS[expense.category]}</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.note} numberOfLines={1}>
            {expense.note || CATEGORY_LABELS[expense.category]}
          </Text>
          <Text style={styles.meta}>
            {CATEGORY_LABELS[expense.category]}
            {demo ? ' · Demo' : ''}
          </Text>
        </View>
        <Text style={[styles.amount, { color }]}>{money(expense.amount)}</Text>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardSelected: { borderColor: palette.primary, borderWidth: 2 },
  glyph: {
    alignItems: 'center',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  glyphText: { fontSize: 24 },
  main: { flex: 1, minWidth: 0 },
  note: { ...type.bodyStrong, color: palette.ink },
  meta: { ...type.caption, color: palette.muted, marginTop: 2 },
  amount: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, lineHeight: 22 },
});
