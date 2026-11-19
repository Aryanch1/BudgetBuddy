import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SpringPress } from './ui';
import { palette, radii, spacing, useResponsive } from '../lib/theme';

/**
 * BudgetBuddy navigation — a flat white bottom tab bar with a soft top
 * border and a violet pill on the active tab. NOT a floating glass pill
 * (FridgeToMeal/MediGuide), NOT a dark ink bar (CivicHelper), NOT top
 * segmented tabs (SplitEase), NOT a flat labeled bar (PlantDoctor).
 * Tabs: Today, Log, Coach, Settings. On wide screens (≥840dp) it
 * becomes a slim left rail with the same violet pill treatment.
 */

export type TabKey = 'today' | 'log' | 'coach' | 'settings';

const TABS: { key: TabKey; label: string; glyph: string; route: string }[] = [
  { key: 'today', label: 'Today', glyph: '◉', route: '/' },
  { key: 'log', label: 'Log', glyph: '+', route: '/log' },
  { key: 'coach', label: 'Coach', glyph: '✦', route: '/coach' },
  { key: 'settings', label: 'Settings', glyph: '⚙', route: '/settings' },
];

export function TabBar({ active }: { active: TabKey }) {
  const router = useRouter();
  const r = useResponsive();

  if (r.twoPane) {
    return (
      <View style={styles.rail}>
        <View style={styles.railMark}>
          <Text style={styles.railMarkText}>B</Text>
        </View>
        {TABS.map((tab) => (
          <SpringPress key={tab.key} onPress={() => router.replace(tab.route as never)}>
            <View style={[styles.railItem, active === tab.key && styles.railItemActive]}>
              <Text style={[styles.railGlyph, active === tab.key && styles.railGlyphActive]}>
                {tab.glyph}
              </Text>
              <Text style={[styles.railLabel, active === tab.key && styles.railLabelActive]}>
                {tab.label}
              </Text>
            </View>
          </SpringPress>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => (
        <SpringPress key={tab.key} onPress={() => router.replace(tab.route as never)}>
          <View style={[styles.tab, active === tab.key && styles.tabActive]}>
            <Text style={[styles.tabGlyph, active === tab.key && styles.tabGlyphActive]}>
              {tab.glyph}
            </Text>
            <Text style={[styles.tabLabel, active === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </View>
        </SpringPress>
      ))}
    </View>
  );
}

/** Content padding that keeps the page clear of the tab bar / rail. */
export function useTabPad(): { paddingBottom: number; paddingLeft: number } {
  const r = useResponsive();
  if (r.twoPane) return { paddingBottom: 32, paddingLeft: 96 };
  return { paddingBottom: 116, paddingLeft: 0 };
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: palette.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.pill,
    minHeight: 52,
    minWidth: 72,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tabActive: { backgroundColor: palette.primary },
  tabGlyph: { color: palette.muted, fontSize: 19, fontWeight: '700' },
  tabGlyphActive: { color: '#FFFFFF' },
  tabLabel: { color: palette.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  tabLabelActive: { color: '#FFFFFF' },
  rail: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRightColor: palette.line,
    borderRightWidth: 1,
    bottom: 0,
    gap: 10,
    left: 0,
    paddingBottom: 28,
    paddingTop: 28,
    position: 'absolute',
    top: 0,
    width: 88,
  },
  railMark: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
    width: 48,
  },
  railMarkText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  railItem: {
    alignItems: 'center',
    borderRadius: 18,
    minHeight: 64,
    justifyContent: 'center',
    width: 68,
  },
  railItemActive: { backgroundColor: palette.primary },
  railGlyph: { color: palette.muted, fontSize: 20, fontWeight: '700' },
  railGlyphActive: { color: '#FFFFFF' },
  railLabel: { color: palette.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  railLabelActive: { color: '#FFFFFF' },
});
