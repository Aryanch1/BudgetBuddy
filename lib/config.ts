/**
 * BudgetBuddy runtime config.
 *
 * The AI coach is a Java Spring Boot service (backend/): POST
 * /api/coach. EXPO_PUBLIC_API_URL is the backend origin when it is
 * deployed (e.g. the deployed URL). When no endpoint answers, the app
 * falls back to its on-device demo coach (lib/coach.ts) and says so
 * honestly — expenses are always saved and visible either way.
 *
 * No Gemini key ever lives in this file or in app code; the key is
 * server-side only in the backend service.
 */

/** Backend origin, or '' when the backend is not deployed yet. */
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

/**
 * Set to true once the Firebase project for BudgetBuddy exists and the
 * values in lib/firebase.ts / lib/firebase.native.ts are the real web
 * config. No project exists yet (2026-11-19) — wiring is a publish
 * step; until then the app runs in full local/guest mode.
 */
export const firebaseConfigured = false;
