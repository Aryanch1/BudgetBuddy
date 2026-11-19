import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuroraBackground } from '../components/AuroraBackground';
import { GhostButton, GlassCard, IconButton, SectionHeader } from '../components/ui';
import { palette, spacing, type, useResponsive } from '../lib/theme';

/** Help & about — how the budget ring and coach work, privacy. */
export default function HelpScreen() {
  const router = useRouter();
  const r = useResponsive();

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Help</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SectionHeader kicker="How it works" title="Simple money habits, in four steps" />
        <GlassCard style={styles.card}>
          <Text style={styles.step}>1 · Log what you spend</Text>
          <Text style={styles.body}>
            Tap a category chip, type the amount, add a note if you like.
            Ten seconds, and the entry is saved.
          </Text>
          <Text style={styles.step}>2 · Watch the ring</Text>
          <Text style={styles.body}>
            The ring on Today shows today&apos;s spending against your daily
            budget (50 dollars by default — change it in Settings). Violet
            while you are on track, red when the day goes over.
          </Text>
          <Text style={styles.step}>3 · Read the coach</Text>
          <Text style={styles.body}>
            The Coach screen sums up the last 7 days and gives three
            practical tips, built from the numbers you actually logged.
          </Text>
          <Text style={styles.step}>4 · Re-use the past</Text>
          <Text style={styles.body}>
            The Log screen groups expenses by day. Tap Re-use on a past
            expense to log the same thing again in one tap.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Important" title="What BudgetBuddy is not" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            BudgetBuddy is a spending log with friendly coaching, not
            financial advice. It does not connect to your bank, and its tips
            are general money habits. For anything binding — debt, tax, a
            big purchase — talk to a qualified adviser.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Demo mode" title="Live AI vs on-device" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            When the live Java backend is connected, coach summaries come
            from Gemini and carry a LIVE AI badge. Until then, the app coaches
            on-device with a rule-based reader and marks it DEMO — it only
            uses the amounts and categories you actually logged, and never
            invents a fact.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Your data" title="Privacy" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            Expenses and history live on your device, and sync to your account
            when you sign in. Nothing is shared with anyone else. The demo
            expenses are sample data; clear them from Settings when you are
            ready.
          </Text>
        </GlassCard>

        <SectionHeader kicker="About" title="BudgetBuddy" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            BudgetBuddy is a daily spending log with a friendly AI coach
            summary — built by Aryanmouli Cherupalli. Designed in Figma;
            React Native + Expo + TypeScript, Gemini AI for the coach
            (Java Spring Boot service), Firebase for accounts and sync.
          </Text>
        </GlassCard>

        <GhostButton label="Back to Today" onPress={() => router.replace('/')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  card: { gap: 10, marginBottom: spacing.xl, padding: spacing.md },
  step: { ...type.subtitle, color: palette.ink },
  body: { ...type.body, color: palette.body },
});
