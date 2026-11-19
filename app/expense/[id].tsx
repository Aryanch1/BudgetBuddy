import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../../components/AuroraBackground';
import { EmptyState, GhostButton, GlassCard, IconButton, PrimaryButton } from '../../components/ui';
import { formatDate, money } from '../../lib/coach';
import { useApp } from '../../lib/store';
import { CATEGORY_GLYPHS, CATEGORY_LABELS } from '../../lib/types';
import { categoryColors, palette, spacing, type, useResponsive } from '../../lib/theme';

/** Expense detail — one entry, full size, with delete. */
export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { expenseById, deleteExpense } = useApp();
  const r = useResponsive();
  const [notice, setNotice] = useState<string | null>(null);

  const expense = expenseById(id ?? '');

  if (!expense) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <View style={styles.scroll}>
          <EmptyState
            glyph="🐷"
            title="Expense not found"
            body="It may have been deleted. Log a new one from the Log screen."
            actionLabel="Go to Log"
            onAction={() => router.replace('/log')}
          />
        </View>
      </View>
    );
  }

  const color = categoryColors[expense.category] ?? palette.primary;

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Expense</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View entering={FadeInDown.springify()}>
          <GlassCard style={styles.card}>
            <View style={[styles.glyph, { backgroundColor: `${color}1F` }]}>
              <Text style={styles.glyphText}>{CATEGORY_GLYPHS[expense.category]}</Text>
            </View>
            <Text style={[styles.amount, { color }]}>{money(expense.amount)}</Text>
            <Text style={styles.note}>{expense.note || CATEGORY_LABELS[expense.category]}</Text>
            <Text style={styles.meta}>
              {CATEGORY_LABELS[expense.category]} · {formatDate(expense.date)}
            </Text>
            {expense.isDemo ? (
              <Text style={styles.demoNote}>
                Demo expense — clear all demo data from Settings when you are ready.
              </Text>
            ) : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.card}>
            <Text style={styles.rowLabel}>Category</Text>
            <Text style={styles.rowValue}>{CATEGORY_LABELS[expense.category]}</Text>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>{formatDate(expense.date)}</Text>
            <Text style={styles.rowLabel}>Amount</Text>
            <Text style={styles.rowValue}>{money(expense.amount)}</Text>
          </GlassCard>
        </Animated.View>

        <PrimaryButton
          label="Log a similar expense"
          onPress={() => router.push({ pathname: '/log', params: { category: expense.category } } as never)}
        />
        <GhostButton
          label="Delete this expense"
          onPress={() => {
            deleteExpense(expense.id);
            setNotice('Deleted.');
            router.replace('/log');
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, paddingTop: 56, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  card: { alignItems: 'center', gap: 10, marginBottom: spacing.lg, padding: spacing.lg },
  glyph: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  glyphText: { fontSize: 36 },
  amount: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 44, lineHeight: 48 },
  note: { ...type.title, color: palette.ink, textAlign: 'center' },
  meta: { ...type.body, color: palette.body, textAlign: 'center' },
  demoNote: { ...type.body, color: palette.muted, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, textAlign: 'center' },
  rowLabel: { ...type.label, color: palette.muted },
  rowValue: { ...type.bodyStrong, color: palette.ink, marginBottom: spacing.sm },
});
