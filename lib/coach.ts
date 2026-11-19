/**
 * BudgetBuddy coach — the on-device demo coach plus the live-backend call.
 *
 * The live coach is the Java Spring Boot service (backend/): POST
 * /api/coach with the week's expenses and the daily budget. The key
 * (GEMINI_API_KEY) lives server-side only, in the backend. When no
 * backend answers, the app falls back to the rule-based demo coach
 * below and says so honestly (DEMO badge) — it only ever uses the
 * numbers the user actually logged, and never invents a fact.
 */

import { API_BASE } from './config';
import {
  CATEGORY_LABELS,
  DEFAULT_DAILY_BUDGET,
  type CoachResponse,
  type CoachSummary,
  type Expense,
  type ExpenseCategory,
} from './types';

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function money0(n: number): string {
  return `$${Math.round(n)}`;
}

/** 'YYYY-MM-DD' for a Date, in local time. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatDayLabel(key: string): string {
  const today = todayKey();
  if (key === today) return 'Today';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === dayKey(y)) return 'Yesterday';
  return formatDate(key);
}

/** Expenses from the last 7 days, newest first. */
export function weekExpenses(expenses: Expense[]): Expense[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const from = dayKey(cutoff);
  return expenses
    .filter((e) => e.date >= from)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export function totalOf(expenses: Expense[]): number {
  return expenses.reduce((n, e) => n + e.amount, 0);
}

export function totalsByCategory(expenses: Expense[]): Record<ExpenseCategory, number> {
  const totals: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    shopping: 0,
    fun: 0,
    bills: 0,
    health: 0,
    other: 0,
  };
  for (const e of expenses) totals[e.category] += e.amount;
  return totals;
}

export function topCategoryOf(expenses: Expense[]): ExpenseCategory | null {
  if (expenses.length === 0) return null;
  const totals = totalsByCategory(expenses);
  let best: ExpenseCategory | null = null;
  let bestTotal = 0;
  for (const c of Object.keys(totals) as ExpenseCategory[]) {
    if (totals[c] > bestTotal) {
      bestTotal = totals[c];
      best = c;
    }
  }
  return best;
}

/**
 * Rule-based demo coach. Tips are chosen from the real numbers:
 * top category, daily-budget pace, biggest single spend, and streak
 * of days under budget. Nothing is invented.
 */
export function demoCoach(expenses: Expense[], dailyBudget = DEFAULT_DAILY_BUDGET): CoachSummary {
  const week = weekExpenses(expenses);
  const weekTotal = totalOf(week);
  const top = topCategoryOf(week);
  const totals = totalsByCategory(week);
  const daysLogged = new Set(week.map((e) => e.date)).size;
  const dailyAvg = daysLogged > 0 ? weekTotal / daysLogged : 0;
  const biggest = week.length > 0 ? [...week].sort((a, b) => b.amount - a.amount)[0] : null;
  const underDays = countUnderBudgetDays(expenses, dailyBudget);

  const tips: string[] = [];
  if (week.length === 0) {
    tips.push(
      'Log your first expense today — even a coffee counts. One small entry a day is the whole habit.',
      'Set your daily budget in Settings so the ring on Today knows what to aim for.',
      'Try the quick-add chips: tap a category, type the amount, done in ten seconds.',
    );
  } else {
    if (top) {
      tips.push(
        `${CATEGORY_LABELS[top]} is your biggest spend this week at ${money(totals[top])}. ` +
          `One cheaper swap there — a home meal, a walk instead of a ride — saves real money by Friday.`,
      );
    }
    if (dailyAvg > dailyBudget) {
      tips.push(
        `You are averaging ${money(dailyAvg)} a day against a ${money0(dailyBudget)} budget. ` +
          `Trim about ${money(dailyAvg - dailyBudget)} a day and the week lands on target.`,
      );
    } else if (week.length > 0) {
      tips.push(
        `You are averaging ${money(dailyAvg)} a day, inside your ${money0(dailyBudget)} budget. ` +
          `Keep the streak going — small days add up to a big month.`,
      );
    }
    if (biggest && biggest.amount >= dailyBudget * 0.8) {
      tips.push(
        `Your biggest single spend was ${money(biggest.amount)} on ${CATEGORY_LABELS[biggest.category].toLowerCase()} ` +
          `(${biggest.note || 'no note'}). Plan big spends a day ahead and they stop surprising you.`,
      );
    } else {
      tips.push(
        'No single spend blew the budget this week. That steady pattern is exactly what a good money habit looks like.',
      );
    }
  }

  const summary =
    week.length === 0
      ? 'No spending logged in the last 7 days yet. Log your first expense and the coach will have something to work with.'
      : `You spent ${money(weekTotal)} over the last 7 days across ${week.length} ${week.length === 1 ? 'expense' : 'expenses'}, ` +
        `about ${money(dailyAvg)} a day${top ? `, with ${CATEGORY_LABELS[top].toLowerCase()} leading at ${money(totals[top])}` : ''}. ` +
        (dailyAvg <= dailyBudget
          ? `That sits inside your ${money0(dailyBudget)} daily budget — nicely done.`
          : `That runs a little over your ${money0(dailyBudget)} daily budget — a small trim gets you back on track.`);

  const encouragement =
    underDays >= 3
      ? `You stayed under budget on ${underDays} days this week. That is a habit worth keeping.`
      : week.length === 0
        ? 'Every budget starts with one honest entry. You have got this.'
        : 'Progress, not perfection — one careful day at a time.';

  return {
    id: `coach-demo-${Date.now()}`,
    summary,
    weekTotal,
    topCategory: top,
    tips: tips.slice(0, 3),
    encouragement,
    source: 'demo',
    at: Date.now(),
  };
}

/** Days in the last 7 with spending at or under the daily budget. */
export function countUnderBudgetDays(expenses: Expense[], dailyBudget: number): number {
  const byDay = new Map<string, number>();
  for (const e of weekExpenses(expenses)) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
  }
  let count = 0;
  for (const total of byDay.values()) {
    if (total <= dailyBudget) count += 1;
  }
  return count;
}

/** Weekly totals for the last 7 days, oldest first, for the bar chart. */
export function weeklyBars(expenses: Expense[]): { key: string; label: string; total: number }[] {
  const out: { key: string; label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const total = expenses.filter((e) => e.date === key).reduce((n, e) => n + e.amount, 0);
    out.push({
      key,
      label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      total,
    });
  }
  return out;
}

/** Ask the live Java backend for a coach summary; null when unreachable. */
export async function fetchLiveCoach(
  expenses: Expense[],
  dailyBudget: number,
): Promise<CoachSummary | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses, dailyBudget }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CoachResponse;
    if (!data.summary || !Array.isArray(data.tips) || data.tips.length === 0) return null;
    return {
      id: `coach-live-${Date.now()}`,
      summary: data.summary,
      weekTotal: data.weekTotal ?? totalOf(weekExpenses(expenses)),
      topCategory: data.topCategory ?? topCategoryOf(weekExpenses(expenses)),
      tips: data.tips.slice(0, 3),
      encouragement: data.encouragement ?? 'Keep going — one careful day at a time.',
      source: 'live',
      at: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Live first, demo fallback — the caller shows which source answered. */
export async function coachSummary(
  expenses: Expense[],
  dailyBudget = DEFAULT_DAILY_BUDGET,
): Promise<CoachSummary> {
  const live = await fetchLiveCoach(expenses, dailyBudget);
  if (live) return live;
  return demoCoach(expenses, dailyBudget);
}

/** Seeded demo expenses so the ring and coach show data on first open. */
export const SAMPLE_EXPENSES: {
  amount: number;
  category: ExpenseCategory;
  note: string;
  daysAgo: number;
}[] = [
  { amount: 12.4, category: 'food', note: 'Lunch bowl downtown', daysAgo: 0 },
  { amount: 4.5, category: 'food', note: 'Morning coffee', daysAgo: 0 },
  { amount: 2.75, category: 'transport', note: 'Bus to campus', daysAgo: 0 },
  { amount: 38.2, category: 'food', note: 'Weekly groceries', daysAgo: 1 },
  { amount: 15.0, category: 'fun', note: 'Movie night', daysAgo: 1 },
  { amount: 9.99, category: 'fun', note: 'Streaming subscription', daysAgo: 2 },
  { amount: 6.5, category: 'food', note: 'Sandwich and juice', daysAgo: 2 },
  { amount: 22.0, category: 'transport', note: 'Rideshare home late', daysAgo: 3 },
  { amount: 18.75, category: 'shopping', note: 'New notebook and pens', daysAgo: 3 },
  { amount: 11.3, category: 'food', note: 'Takeout tacos', daysAgo: 4 },
  { amount: 3.25, category: 'transport', note: 'Metro card top up', daysAgo: 4 },
  { amount: 45.0, category: 'bills', note: 'Phone bill share', daysAgo: 5 },
  { amount: 8.4, category: 'health', note: 'Vitamins', daysAgo: 6 },
];
