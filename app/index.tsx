import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import { BudgetRing } from '../components/BudgetRing';
import { ExpenseCard } from '../components/ExpenseCard';
import { PullToRefresh, PiggyRefreshButton } from '../components/PiggyRefresh';
import { TabBar, useTabPad } from '../components/TabBar';
import { Chip, EmptyState, GlassCard, IconButton, PrimaryButton } from '../components/ui';
import { coachSummary, formatDayLabel, money, todayKey } from '../lib/coach';
import { useApp } from '../lib/store';
import { CATEGORIES, CATEGORY_LABELS, type CoachSummary } from '../lib/types';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';

/**
 * Today (Home) — the data hero. A big budget ring (spent today vs the
 * daily budget) with the big bold spent number in the centre, a coach
 * tip card below, quick-add category chips, then today's entries as a
 * timeline. On ≥840dp the screen splits: ring + entries on the left,
 * the coach card on the right. No photo hero — this is a money tool.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { expenses, spentToday, weekTotal, underBudgetDays, dailyBudget, user, guest } = useApp();
  const r = useResponsive();
  const tabPad = useTabPad();
  const [refreshing, setRefreshing] = useState(false);
  const [coach, setCoach] = useState<CoachSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCoach = useCallback(() => {
    void coachSummary(expenses, dailyBudget).then(setCoach);
  }, [expenses, dailyBudget]);

  useEffect(() => {
    loadCoach();
  }, [loadCoach]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCoach();
    // The ledger is local; refresh re-reads state and replays the piggy.
    setTimeout(() => setRefreshing(false), 900);
  }, [loadCoach]);

  const today = expenses
    .filter((e) => e.date === todayKey())
    .sort((a, b) => b.createdAt - a.createdAt);
  const selected = expenses.find((e) => e.id === selectedId) ?? today[0] ?? null;
  const hasDemo = expenses.some((e) => e.isDemo);

  const quickAdd = (category: (typeof CATEGORIES)[number]) => {
    router.push({ pathname: '/log', params: { category } } as never);
  };

  const hero = (
    <>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.kicker}>BUDGETBUDDY</Text>
        <Text style={[styles.hero, r.display]}>Know where the money went.</Text>
        <Text style={styles.heroBody}>
          Log what you spend, watch the ring, and let the coach keep the
          week honest — one small entry at a time.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <GlassCard style={styles.ringCard}>
          <BudgetRing spent={spentToday} budget={dailyBudget} />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{money(weekTotal)}</Text>
              <Text style={styles.statLabel}>this week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{underBudgetDays}/7</Text>
              <Text style={styles.statLabel}>days under budget</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{today.length}</Text>
              <Text style={styles.statLabel}>entries today</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <GlassCard style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <Text style={styles.coachKicker}>COACH SAYS</Text>
            {coach ? (
              <Text style={styles.coachBadge}>{coach.source === 'live' ? 'LIVE AI' : 'DEMO'}</Text>
            ) : null}
          </View>
          <Text style={styles.coachTip}>
            {coach ? coach.tips[0] ?? coach.summary : 'Asking the coach…'}
          </Text>
          <PrimaryButton label="See the full coach summary" onPress={() => router.push('/coach')} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).springify()}>
        <Text style={styles.chipsTitle}>Quick add</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c]} selected={false} onPress={() => quickAdd(c)} />
          ))}
        </View>
      </Animated.View>
    </>
  );

  const list = (
    <View style={styles.list}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Today</Text>
        {Platform.OS === 'web' ? (
          <Pressable onPress={onRefresh} hitSlop={8}>
            <View style={styles.webRefresh}>
              <PiggyRefreshButton refreshing={refreshing} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {hasDemo ? (
        <Text style={styles.demoNote}>
          Showing demo expenses so you can see the ring and coach at work — clear them in Settings.
        </Text>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {today.length === 0 ? (
        <EmptyState
          glyph="🐷"
          title="Nothing spent today yet"
          body="Log your first expense of the day and the ring starts moving. Even a coffee counts."
          actionLabel="Log an expense"
          onAction={() => router.push('/log')}
        />
      ) : (
        today.map((expense, i) => (
          <View key={expense.id}>
            {r.twoPane ? (
              <Pressable
                onPress={() => {
                  setSelectedId(expense.id);
                  setNotice(`Showing ${expense.note || 'expense'} on the right.`);
                }}
              >
                <ExpenseCard expense={expense} index={i} selected={selected?.id === expense.id} demo={expense.isDemo} />
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push(`/expense/${expense.id}` as never)}>
                <ExpenseCard expense={expense} index={i} demo={expense.isDemo} />
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );

  if (r.twoPane) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <View style={[styles.twoPane, { paddingLeft: tabPad.paddingLeft }]}>
          <View style={styles.paneList}>
            <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
              <View style={styles.paneScrollContent}>
                {hero}
                {list}
              </View>
            </PullToRefresh>
          </View>
          <View style={styles.paneDetail}>
            {selected ? (
              <GlassCard style={styles.detailCard}>
                <Text style={styles.detailKicker}>{formatDayLabel(selected.date).toUpperCase()}</Text>
                <Text style={styles.detailTitle}>{selected.note || CATEGORY_LABELS[selected.category]}</Text>
                <Text style={styles.detailAmount}>{money(selected.amount)}</Text>
                <Text style={styles.detailSummary}>
                  {CATEGORY_LABELS[selected.category]} · {selected.date}
                </Text>
                <PrimaryButton
                  label="Open the full entry"
                  onPress={() => router.push(`/expense/${selected.id}` as never)}
                />
              </GlassCard>
            ) : (
              <EmptyState glyph="🐷" title="Nothing selected" body="Pick an expense on the left to see it here." />
            )}
          </View>
        </View>
        <TabBar active="today" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View style={[styles.scroll, { paddingBottom: tabPad.paddingBottom }]}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greetingText}>
                {user?.name ? `Hello, ${user.name.split(' ')[0]}` : guest ? 'Hello, guest' : 'Hello'}
              </Text>
            </View>
            <IconButton label="⚙" onPress={() => router.push('/settings')} />
          </View>
          {hero}
          {list}
        </View>
      </PullToRefresh>
      <TabBar active="today" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingTop: 56 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  greetingText: { ...type.subtitle, color: palette.ink },
  kicker: { ...type.label, color: palette.primary, marginBottom: 8 },
  hero: { color: palette.ink, marginBottom: 10 },
  heroBody: { ...type.body, color: palette.body, marginBottom: spacing.lg, maxWidth: 560 },
  ringCard: { alignItems: 'center', gap: 8, marginBottom: spacing.lg, padding: spacing.lg },
  stats: {
    alignItems: 'center',
    backgroundColor: palette.ink,
    borderRadius: radii.card,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingVertical: 16,
    width: '100%',
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, lineHeight: 24 },
  statLabel: { color: 'rgba(251, 248, 243, 0.65)', fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  statDivider: { backgroundColor: 'rgba(255,255,255,0.18)', height: 36, width: 1 },
  coachCard: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  coachHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  coachKicker: { ...type.label, color: palette.accentDeep },
  coachBadge: {
    backgroundColor: palette.accentSoft,
    borderRadius: radii.pill,
    color: palette.accentDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  coachTip: { ...type.body, color: palette.ink },
  chipsTitle: { ...type.subtitle, color: palette.ink, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  list: { gap: 0 },
  listHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  listTitle: { ...type.title, color: palette.ink },
  demoNote: { ...type.body, color: palette.muted, marginBottom: spacing.md },
  notice: { ...type.bodyStrong, color: palette.success, marginBottom: spacing.md, textAlign: 'center' },
  webRefresh: { height: 56, width: 56 },
  twoPane: { flex: 1, flexDirection: 'row', gap: 24, padding: 28 },
  paneList: { flex: 1.1 },
  paneScrollContent: { paddingBottom: 32, paddingTop: 8 },
  paneDetail: { flex: 1, paddingTop: 120 },
  detailCard: { gap: 12, padding: spacing.lg },
  detailKicker: { ...type.label, color: palette.accentDeep },
  detailTitle: { ...type.title, color: palette.ink },
  detailAmount: { color: palette.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 36, lineHeight: 40 },
  detailSummary: { ...type.body, color: palette.body },
});
