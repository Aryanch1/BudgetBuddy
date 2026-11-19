import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import { PiggyRefreshButton, PullToRefresh } from '../components/PiggyRefresh';
import { TabBar, useTabPad } from '../components/TabBar';
import { BouncingDots, DemoBadge, EmptyState, GlassCard, IconButton, LiveBadge, PrimaryButton, Skeleton } from '../components/ui';
import { coachSummary, money, money0, totalsByCategory, weeklyBars } from '../lib/coach';
import { useApp } from '../lib/store';
import { CATEGORIES, CATEGORY_LABELS, type CoachSummary } from '../lib/types';
import { categoryColors, palette, spacing, type, useResponsive } from '../lib/theme';

/**
 * Coach — the AI summary screen. A friendly summary of the last 7
 * days, a weekly bar chart, the top category, and three practical tips.
 * The badge says honestly whether the answer came from the live backend
 * (LIVE AI) or the on-device demo coach (DEMO).
 */
export default function CoachScreen() {
  const router = useRouter();
  const { expenses, dailyBudget } = useApp();
  const r = useResponsive();
  const tabPad = useTabPad();
  const [coach, setCoach] = useState<CoachSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;
    void coachSummary(expenses, dailyBudget).then((c) => {
      if (!alive) return;
      setCoach(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [expenses, dailyBudget]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void coachSummary(expenses, dailyBudget).then((c) => {
      setCoach(c);
      setRefreshing(false);
    });
  }, [expenses, dailyBudget]);

  const bars = weeklyBars(expenses);
  const maxBar = Math.max(1, ...bars.map((b) => b.total));
  const totals = totalsByCategory(expenses);
  const weekTotal = bars.reduce((n, b) => n + b.total, 0);

  const body = (
    <>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.kicker}>YOUR COACH</Text>
        <Text style={[styles.hero, r.display]}>A friendly word about your week.</Text>
        <Text style={styles.heroBody}>
          Three practical tips, built from the numbers you actually logged
          — never invented, never judging.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryKicker}>THIS WEEK</Text>
            {loading ? null : coach?.source === 'live' ? <LiveBadge /> : <DemoBadge />}
          </View>
          {loading || !coach ? (
            <>
              <Skeleton width="100%" height={18} />
              <Skeleton width="85%" height={18} />
              <BouncingDots />
            </>
          ) : (
            <>
              <Text style={styles.summary}>{coach.summary}</Text>
              <Text style={styles.encouragement}>{coach.encouragement}</Text>
            </>
          )}
          <View style={styles.weekRow}>
            <View style={styles.weekStat}>
              <Text style={styles.weekNum}>{money(weekTotal)}</Text>
              <Text style={styles.weekLabel}>spent this week</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekNum}>{money0(dailyBudget)}</Text>
              <Text style={styles.weekLabel}>daily budget</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <GlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 7 days</Text>
          <View style={styles.bars}>
            {bars.map((b) => (
              <View key={b.key} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(4, Math.round((b.total / maxBar) * 100))}%`,
                        backgroundColor: b.total > dailyBudget ? palette.over : palette.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{b.label}</Text>
                <Text style={styles.barValue}>{b.total > 0 ? money0(b.total) : ''}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartNote}>
            Bars over the daily budget ({money0(dailyBudget)}) show in red.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).springify()}>
        <GlassCard style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Three things to try</Text>
          {loading || !coach ? (
            <BouncingDots />
          ) : (
            coach.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipNum}>
                  <Text style={styles.tipNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <GlassCard style={styles.catsCard}>
          <Text style={styles.tipsTitle}>Where it went this week</Text>
          {CATEGORIES.map((c) => {
            const total = totals[c];
            const pct = weekTotal > 0 ? Math.round((total / weekTotal) * 100) : 0;
            return (
              <View key={c} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: categoryColors[c] }]} />
                <Text style={styles.catLabel}>{CATEGORY_LABELS[c]}</Text>
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catFill,
                      { width: `${pct}%`, backgroundColor: categoryColors[c] },
                    ]}
                  />
                </View>
                <Text style={styles.catValue}>{money(total)}</Text>
              </View>
            );
          })}
          {weekTotal === 0 ? (
            <EmptyState
              glyph="🐷"
              title="No spending logged yet"
              body="Log a few expenses and the coach will have a week to talk about."
              actionLabel="Log an expense"
              onAction={() => router.push('/log')}
            />
          ) : null}
        </GlassCard>
      </Animated.View>

      <PrimaryButton label="Log an expense" onPress={() => router.push('/log')} />
      {Platform.OS === 'web' ? (
        <Pressable onPress={onRefresh} hitSlop={8}>
          <View style={styles.webRefresh}>
            <PiggyRefreshButton refreshing={refreshing} />
          </View>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View style={[styles.scroll, { paddingBottom: tabPad.paddingBottom, maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.topRow}>
            <IconButton label="←" onPress={() => router.back()} />
            <Text style={styles.headerTitle}>Coach</Text>
            <View style={styles.headerSpacer} />
          </View>
          {body}
        </View>
      </PullToRefresh>
      <TabBar active="coach" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingTop: 56 },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 44 },
  kicker: { ...type.label, color: palette.primary, marginBottom: 8 },
  hero: { color: palette.ink, marginBottom: 10 },
  heroBody: { ...type.body, color: palette.body, marginBottom: spacing.lg, maxWidth: 560 },
  summaryCard: { gap: 12, marginBottom: spacing.lg, padding: spacing.md },
  summaryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  summaryKicker: { ...type.label, color: palette.accentDeep },
  summary: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 24 },
  encouragement: { ...type.bodyStrong, color: palette.primary },
  weekRow: { borderTopColor: palette.line, borderTopWidth: 1, flexDirection: 'row', gap: 16, paddingTop: 12 },
  weekStat: { flex: 1 },
  weekNum: { color: palette.ink, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, lineHeight: 28 },
  weekLabel: { ...type.caption, color: palette.muted, marginTop: 2 },
  chartCard: { gap: 12, marginBottom: spacing.lg, padding: spacing.md },
  chartTitle: { ...type.subtitle, color: palette.ink },
  bars: { alignItems: 'flex-end', flexDirection: 'row', gap: 6, height: 140, justifyContent: 'space-between' },
  barCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { alignItems: 'center', flex: 1, justifyContent: 'flex-end', width: '100%' },
  barFill: { borderRadius: 8, width: '70%' },
  barLabel: { ...type.caption, color: palette.muted, marginTop: 6 },
  barValue: { color: palette.ink, fontSize: 11, fontWeight: '700' },
  chartNote: { ...type.body, color: palette.muted },
  tipsCard: { gap: 14, marginBottom: spacing.lg, padding: spacing.md },
  tipsTitle: { ...type.subtitle, color: palette.ink },
  tipRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  tipNum: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  tipNumText: { color: palette.ink, fontSize: 16, fontWeight: '900' },
  tipText: { ...type.body, color: palette.ink, flex: 1 },
  catsCard: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  catRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  catDot: { borderRadius: 6, height: 12, width: 12 },
  catLabel: { ...type.bodyStrong, color: palette.ink, width: 76 },
  catTrack: { backgroundColor: palette.primaryPale, borderRadius: 6, flex: 1, height: 10, overflow: 'hidden' },
  catFill: { borderRadius: 6, height: '100%' },
  catValue: { ...type.bodyStrong, color: palette.ink, textAlign: 'right', width: 64 },
  webRefresh: { alignSelf: 'center', height: 56, marginTop: spacing.md, width: 56 },
});
