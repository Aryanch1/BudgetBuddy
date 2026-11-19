/** BudgetBuddy shared types. Dates are 'YYYY-MM-DD' strings. */

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'fun'
  | 'bills'
  | 'health'
  | 'other';

export const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'shopping',
  'fun',
  'bills',
  'health',
  'other',
];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  transport: 'Transport',
  shopping: 'Shopping',
  fun: 'Fun',
  bills: 'Bills',
  health: 'Health',
  other: 'Other',
};

export const CATEGORY_GLYPHS: Record<ExpenseCategory, string> = {
  food: '🍽',
  transport: '🚌',
  shopping: '🛍',
  fun: '🎬',
  bills: '🧾',
  health: '💊',
  other: '✦',
};

export interface Expense {
  id: string;
  /** Amount in the user's currency (dollars). */
  amount: number;
  category: ExpenseCategory;
  note: string;
  /** 'YYYY-MM-DD' — the day the money was spent. */
  date: string;
  /** Epoch milliseconds the entry was added. */
  createdAt: number;
  /** Seeded demo content — clearable from Settings. */
  isDemo?: boolean;
}

export interface HistoryEntry {
  id: string;
  expenseId: string;
  /** Short label, e.g. "Coffee · Food · $4.50". */
  title: string;
  category: ExpenseCategory;
  amount: number;
  /** Epoch milliseconds the expense was added. */
  at: number;
}

export type CoachSource = 'live' | 'demo';

export interface CoachSummary {
  id: string;
  /** One or two friendly sentences about this week's spending. */
  summary: string;
  /** Total spent in the last 7 days. */
  weekTotal: number;
  /** Top category this week, or null when there is nothing to rank. */
  topCategory: ExpenseCategory | null;
  /** Three practical tips, plain and specific. */
  tips: string[];
  /** One encouraging line. */
  encouragement: string;
  source: CoachSource;
  /** Epoch milliseconds the summary was made. */
  at: number;
}

export interface CoachRequest {
  expenses: Expense[];
  dailyBudget: number;
}

export interface CoachResponse {
  summary?: string;
  weekTotal?: number;
  topCategory?: ExpenseCategory | null;
  tips?: string[];
  encouragement?: string;
  error?: { message?: string };
}

/** Default daily budget in dollars — editable in Settings. */
export const DEFAULT_DAILY_BUDGET = 50;
