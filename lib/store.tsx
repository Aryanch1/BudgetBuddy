import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from './firebase';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { firebaseConfigured } from './config';
import {
  SAMPLE_EXPENSES,
  dayKey,
  todayKey,
  totalOf,
  weekExpenses,
} from './coach';
import { signInWithGoogle } from './google';
import {
  DEFAULT_DAILY_BUDGET,
  type Expense,
  type ExpenseCategory,
  type HistoryEntry,
} from './types';

const EXPENSES_KEY = 'budgetbuddy:expenses:v1';
const HISTORY_KEY = 'budgetbuddy:history:v1';
const SEEDED_KEY = 'budgetbuddy:seeded:v1';
const BUDGET_KEY = 'budgetbuddy:daily-budget:v1';
const HISTORY_LIMIT = 20;

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  /** 'google.com' or 'password' — how this account signs in. */
  provider: string | null;
}

export interface AppState {
  expenses: Expense[];
  history: HistoryEntry[];
  dailyBudget: number;
  setDailyBudget: (n: number) => void;
  /** Total spent today. */
  spentToday: number;
  /** Total spent in the last 7 days. */
  weekTotal: number;
  /** Days in the last 7 at or under the daily budget. */
  underBudgetDays: number;
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setAvatarData: (dataUrl: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  addExpense: (input: {
    amount: number;
    category: ExpenseCategory;
    note: string;
    date: string;
  }) => Expense;
  deleteExpense: (expenseId: string) => void;
  applyHistory: (entry: HistoryEntry) => Expense | null;
  clearHistory: () => void;
  clearDemoData: () => void;
  expenseById: (id: string) => Expense | undefined;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** First-run demo content so the ring and coach show data immediately. */
function seedDemo(): { expenses: Expense[]; history: HistoryEntry[] } {
  const now = Date.now();
  const expenses: Expense[] = SAMPLE_EXPENSES.map((sample, i) => {
    const d = new Date();
    d.setDate(d.getDate() - sample.daysAgo);
    return {
      id: `demo-exp-${i}`,
      amount: sample.amount,
      category: sample.category,
      note: sample.note,
      date: dayKey(d),
      createdAt: now - (SAMPLE_EXPENSES.length - i) * 60000,
      isDemo: true,
    };
  });
  const history: HistoryEntry[] = expenses.map((e) => ({
    id: `h-${e.id}`,
    expenseId: e.id,
    title: `${e.note} · ${e.category} · $${e.amount.toFixed(2)}`,
    category: e.category,
    amount: e.amount,
    at: e.createdAt,
  }));
  return { expenses, history };
}

async function upsertProfile(u: User): Promise<void> {
  if (!firebaseConfigured) return;
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base = {
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      photoURL: u.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }
  } catch {
    // Sync is best-effort; the app keeps working offline.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [dailyBudget, setDailyBudgetState] = useState<number>(DEFAULT_DAILY_BUDGET);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const expensesRef = useRef<Expense[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // Local data loads once at startup; first launch seeds demo expenses.
  useEffect(() => {
    void (async () => {
      const [eRaw, hRaw, seeded, bRaw] = await Promise.all([
        AsyncStorage.getItem(EXPENSES_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SEEDED_KEY),
        AsyncStorage.getItem(BUDGET_KEY),
      ]);
      const e = loadJson<Expense[]>(eRaw);
      const h = loadJson<HistoryEntry[]>(hRaw);
      const b = loadJson<number>(bRaw);
      if (typeof b === 'number' && b > 0) setDailyBudgetState(b);
      if (e && e.length > 0) {
        setExpenses(e);
        setHistory(h ?? []);
      } else if (!seeded) {
        const demo = seedDemo();
        setExpenses(demo.expenses);
        setHistory(demo.history);
        await AsyncStorage.setItem(SEEDED_KEY, '1');
      }
      historyLoadedRef.current = true;
    })();
  }, []);

  // Local mirrors.
  useEffect(() => {
    expensesRef.current = expenses;
    AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)).catch(() => undefined);
  }, [expenses]);
  useEffect(() => {
    historyRef.current = history;
    if (!historyLoadedRef.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => undefined);
  }, [history]);
  useEffect(() => {
    AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(dailyBudget)).catch(() => undefined);
  }, [dailyBudget]);

  // Auth state: profile write, cloud subscriptions.
  // Readiness waits for Firebase to finish restoring any persisted
  // session from storage — the gate must not decide "signed out" (and
  // show Welcome) before the saved session has had its chance to load.
  useEffect(() => {
    let alive = true;
    void auth.authStateReady().then(() => {
      if (alive) setAuthReady(true);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      for (const fn of unsubsRef.current) fn();
      unsubsRef.current = [];
      if (!u) {
        setUser(null);
        return;
      }
      setUser({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        photo: u.photoURL,
        provider: u.providerData[0]?.providerId ?? null,
      });
      void upsertProfile(u);
      if (!firebaseConfigured) return;

      const subscribe = <T,>(
        colName: string,
        apply: (items: T[]) => void,
        local: () => T[],
        idOf: (item: T) => string,
      ) => {
        const col = collection(db, 'users', u.uid, colName);
        unsubsRef.current.push(
          onSnapshot(
            col,
            (snap) => {
              apply(snap.docs.map((d) => d.data() as T));
            },
            () => undefined,
          ),
        );
        // One-time merge: anything saved locally before sign-in joins the account.
        void (async () => {
          try {
            const cloud = await getDocs(col);
            const cloudIds = new Set(cloud.docs.map((d) => d.id));
            for (const item of local()) {
              const id = idOf(item);
              if (!cloudIds.has(id)) {
                await setDoc(
                  doc(db, 'users', u.uid, colName, id),
                  item as unknown as Record<string, unknown>,
                );
              }
            }
          } catch {
            // Best-effort merge only.
          }
        })();
      };
      subscribe<Expense>('expenses', setExpenses, () => expensesRef.current, (e) => e.id);
      subscribe<HistoryEntry>('history', setHistory, () => historyRef.current, (h) => h.id);

      // Profile doc: a custom avatar / edited name stored there overrides
      // the auth copy.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) =>
              prev && prev.uid === u.uid
                ? {
                    ...prev,
                    name: (data.displayName as string) || prev.name,
                    photo: (data.photoData as string) || prev.photo,
                  }
                : prev,
            );
          }
        } catch {
          // Keep the auth profile.
        }
      })();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const spentToday = useMemo(
    () => totalOf(expenses.filter((e) => e.date === todayKey())),
    [expenses],
  );

  const weekTotal = useMemo(() => totalOf(weekExpenses(expenses)), [expenses]);

  const underBudgetDays = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of weekExpenses(expenses)) {
      byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
    }
    let count = 0;
    for (const total of byDay.values()) {
      if (total <= dailyBudget) count += 1;
    }
    return count;
  }, [expenses, dailyBudget]);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
        setUser({
          uid: cred.user.uid,
          name: cleanName,
          email: cred.user.email,
          photo: null,
          provider: 'password',
        });
        void upsertProfile({ ...cred.user, displayName: cleanName } as User);
      }
    },
    [],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const clean = name.trim();
    await updateProfile(currentUser, { displayName: clean });
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { displayName: clean }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, name: clean } : prev));
  }, []);

  const setAvatarData = useCallback(async (dataUrl: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { photoData: dataUrl }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, photo: dataUrl } : prev));
  }, []);

  const sendPasswordReset = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    await sendPasswordResetEmail(auth, currentUser.email);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen — the gate routes there as soon as the
    // user is signed out and not a guest.
    setGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    // Deliberately NOT persisted: guest lasts for this visit only, so the
    // next open asks for sign-in again. A signed-in user, by contrast,
    // stays signed in (Firebase Auth persistence).
    setGuest(true);
  }, []);

  const syncDoc = useCallback(
    (colName: string, id: string, data: unknown) => {
      if (!user || !firebaseConfigured) return;
      void setDoc(doc(db, 'users', user.uid, colName, id), data).catch(() => undefined);
    },
    [user],
  );

  const deleteDocCloud = useCallback(
    (colName: string, id: string) => {
      if (!user || !firebaseConfigured) return;
      void deleteDoc(doc(db, 'users', user.uid, colName, id)).catch(() => undefined);
    },
    [user],
  );

  const setDailyBudget = useCallback((n: number) => {
    if (Number.isFinite(n) && n > 0) setDailyBudgetState(Math.round(n * 100) / 100);
  }, []);

  const addExpense = useCallback(
    (input: {
      amount: number;
      category: ExpenseCategory;
      note: string;
      date: string;
    }): Expense => {
      const expense: Expense = {
        id: uid('exp'),
        amount: Math.round(input.amount * 100) / 100,
        category: input.category,
        note: input.note.trim(),
        date: input.date,
        createdAt: Date.now(),
      };
      setExpenses((prev) => [expense, ...prev]);
      syncDoc('expenses', expense.id, expense);
      const entry: HistoryEntry = {
        id: uid('h'),
        expenseId: expense.id,
        title: `${expense.note || 'Expense'} · ${expense.category} · $${expense.amount.toFixed(2)}`,
        category: expense.category,
        amount: expense.amount,
        at: expense.createdAt,
      };
      setHistory((prev) =>
        prev.some((h) => h.expenseId === expense.id)
          ? prev
          : [entry, ...prev].slice(0, HISTORY_LIMIT),
      );
      syncDoc('history', entry.id, entry);
      return expense;
    },
    [syncDoc],
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      setHistory((prev) => prev.filter((h) => h.expenseId !== expenseId));
      deleteDocCloud('expenses', expenseId);
    },
    [deleteDocCloud],
  );

  const applyHistory = useCallback(
    (entry: HistoryEntry): Expense | null => {
      return expensesRef.current.find((e) => e.id === entry.expenseId) ?? null;
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user && firebaseConfigured) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'history'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
    }
  }, [user]);

  const clearDemoData = useCallback(() => {
    const demoIds = new Set(expensesRef.current.filter((e) => e.isDemo).map((e) => e.id));
    setExpenses((prev) => prev.filter((e) => !e.isDemo));
    setHistory((prev) => prev.filter((h) => !demoIds.has(h.expenseId)));
    if (user && firebaseConfigured) {
      for (const id of demoIds) {
        void deleteDoc(doc(db, 'users', user.uid, 'expenses', id)).catch(() => undefined);
      }
    }
  }, [user]);

  const expenseById = useCallback(
    (id: string) => expenses.find((e) => e.id === id),
    [expenses],
  );

  const value = useMemo<AppState>(
    () => ({
      expenses,
      history,
      dailyBudget,
      setDailyBudget,
      spentToday,
      weekTotal,
      underBudgetDays,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addExpense,
      deleteExpense,
      applyHistory,
      clearHistory,
      clearDemoData,
      expenseById,
    }),
    [
      expenses,
      history,
      dailyBudget,
      setDailyBudget,
      spentToday,
      weekTotal,
      underBudgetDays,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addExpense,
      deleteExpense,
      applyHistory,
      clearHistory,
      clearDemoData,
      expenseById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
