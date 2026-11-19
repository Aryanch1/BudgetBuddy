import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import { ExpenseCard } from '../components/ExpenseCard';
import { TabBar, useTabPad } from '../components/TabBar';
import { Chip, EmptyState, GlassCard, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { formatDayLabel, money, todayKey } from '../lib/coach';
import { useApp } from '../lib/store';
import { CATEGORIES, CATEGORY_GLYPHS, CATEGORY_LABELS, type ExpenseCategory } from '../lib/types';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';

/**
 * Log — add an expense and see the history. The add form is a sheet at
 * the top (amount, category chips, note, date); below it, expenses are
 * grouped by day, newest first. History entries re-use in one tap: they
 * pre-fill the form and scroll it into view, with a visible confirmation
 * where the user is looking.
 */
export default function LogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; reuse?: string }>();
  const { expenses, history, addExpense, applyHistory, dailyBudget } = useApp();
  const r = useResponsive();
  const tabPad = useTabPad();
  const scrollRef = useRef<{ scrollTo: (options: { y: number; animated?: boolean }) => void } | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(
    (params.category as ExpenseCategory) ?? 'food',
  );
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayKey());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof expenses>();
    for (const e of [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return [...map.entries()];
  }, [expenses]);

  const save = () => {
    const value = Number.parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      setError('Type an amount first — a number bigger than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Use a date like 2026-11-19.');
      return;
    }
    setError(null);
    const expense = addExpense({ amount: value, category, note, date });
    setSavedId(expense.id);
    setNotice(
      `Saved ${money(value)} on ${CATEGORY_LABELS[category].toLowerCase()} — ` +
        (value > dailyBudget ? 'that puts today over budget.' : 'nicely inside the daily budget.'),
    );
    setAmount('');
    setNote('');
    setDate(todayKey());
    // Show the saved entry where the user is looking: scroll to the list.
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const reuse = (entryId: string) => {
    const entry = history.find((h) => h.id === entryId);
    if (!entry) return;
    const expense = applyHistory(entry);
    if (!expense) {
      setError('That expense is no longer saved.');
      return;
    }
    setAmount(expense.amount.toFixed(2));
    setCategory(expense.category);
    setNote(expense.note);
    setDate(todayKey());
    setNotice(`Re-using “${expense.note || CATEGORY_LABELS[expense.category]}” — check the amount and save.`);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const form = (
    <GlassCard style={styles.form}>
      <Text style={styles.formTitle}>Log an expense</Text>
      <TextInput
        style={styles.amountInput}
        value={amount}
        onChangeText={setAmount}
        placeholder="$0.00"
        placeholderTextColor={palette.muted}
        keyboardType="decimal-pad"
      />
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={`${CATEGORY_GLYPHS[c]} ${CATEGORY_LABELS[c]}`}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="What was it? (optional)"
        placeholderTextColor={palette.muted}
      />
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={palette.muted}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <PrimaryButton label="Save expense" onPress={save} />
    </GlassCard>
  );

  const historyList = (
    <View>
      <SectionHeader kicker="History" title="Past expenses" />
      {grouped.length === 0 ? (
        <EmptyState
          glyph="🐷"
          title="No expenses yet"
          body="Log your first expense above and it will show up here, grouped by day, ready to re-use."
        />
      ) : (
        grouped.map(([day, dayExpenses]) => (
          <View key={day} style={styles.dayGroup}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{formatDayLabel(day)}</Text>
              <Text style={styles.dayTotal}>
                {money(dayExpenses.reduce((n, e) => n + e.amount, 0))}
              </Text>
            </View>
            {dayExpenses.map((expense, i) => (
              <Pressable key={expense.id} onPress={() => router.push(`/expense/${expense.id}` as never)}>
                <ExpenseCard expense={expense} index={i} demo={expense.isDemo} />
              </Pressable>
            ))}
          </View>
        ))
      )}
      {history.length > 0 ? (
        <>
          <SectionHeader kicker="One tap" title="Re-use a past expense" />
          <GlassCard style={styles.reuseCard}>
            {history.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.reuseRow}>
                <View style={styles.reuseMain}>
                  <Text style={styles.reuseTitle} numberOfLines={1}>{entry.title}</Text>
                  <Text style={styles.reuseMeta}>{CATEGORY_LABELS[entry.category]} · {money(entry.amount)}</Text>
                </View>
                <Chip label="Re-use" selected={false} onPress={() => reuse(entry.id)} />
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}
    </View>
  );

  if (r.twoPane) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <View style={[styles.twoPane, { paddingLeft: tabPad.paddingLeft }]}>
          <ScrollView
            ref={(r) => {
              scrollRef.current = r;
            }}
            style={styles.pane}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.paneScrollContent}
          >
            <Animated.View entering={FadeInDown.springify()}>
              <View style={styles.header}>
                <IconButton label="←" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Log</Text>
                <View style={styles.headerSpacer} />
              </View>
              {form}
            </Animated.View>
          </ScrollView>
          <ScrollView
            style={styles.pane}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.paneScrollContent}
          >
            {historyList}
          </ScrollView>
        </View>
        <TabBar active="log" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabPad.paddingBottom }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Log</Text>
          <View style={styles.headerSpacer} />
        </View>
        {form}
        {savedId ? (
          <Text style={styles.savedHint}>Saved — find it in the list below or on Today.</Text>
        ) : null}
        {historyList}
      </ScrollView>
      <TabBar active="log" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingTop: 56 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  form: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  formTitle: { ...type.title, color: palette.ink },
  amountInput: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.input,
    color: palette.ink,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    minHeight: 64,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.input,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  error: { ...type.bodyStrong, color: palette.error, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, textAlign: 'center' },
  savedHint: { ...type.body, color: palette.muted, marginBottom: spacing.md, textAlign: 'center' },
  dayGroup: { marginBottom: spacing.lg },
  dayHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  dayTitle: { ...type.subtitle, color: palette.ink },
  dayTotal: { color: palette.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16 },
  reuseCard: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  reuseRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  reuseMain: { flex: 1, minWidth: 0 },
  reuseTitle: { ...type.bodyStrong, color: palette.ink },
  reuseMeta: { ...type.caption, color: palette.muted, marginTop: 2 },
  twoPane: { flex: 1, flexDirection: 'row', gap: 24, padding: 28 },
  pane: { flex: 1 },
  paneScrollContent: { paddingBottom: 32, paddingTop: 8 },
});
