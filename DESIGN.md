# BudgetBuddy — Design Spec

**App:** BudgetBuddy — a daily spending log with a friendly AI coach summary; simple money habits.
**Purpose:** Log what you spend, see the day against a budget ring, and get a weekly coach summary with three practical tips. For anyone who wants a calmer relationship with money — students, roommates, first-job savers — without connecting a bank account.

**Figma:** https://www.figma.com/design/EWAwlD58VlOgXAbjLn4bnc — "BudgetBuddy — Daily App"

## Identity

A money ledger that feels calm, not corporate. The visual identity is
**data-first, not photo-first**: the hero is a budget ring, the imagery
layer is a designed graphic system (ring, category bars, piggy motif),
and there is no photo anywhere in the app.

- **Palette:** deep violet primary `#5A2EE6` (disciplined, used on
  primary CTAs, the ring, active tabs), lime accent `#A3E635` used
  sparingly (coach highlights, positive deltas, the piggy coin), warm
  paper background `#FBF8F3`, ink `#241F2E`, soft violet tint `#F1EDFD`.
  Over-budget reads red `#C0392B`; on-track reads lime green `#65A30D`.
- **Display font:** Space Grotesk 700 (bundled via
  `@expo-google-fonts/space-grotesk`). Previous apps used Sora
  (FridgeToMeal/MediGuide), Fraunces (SplitEase), Bricolage Grotesque
  (PlantDoctor) and Archivo (CivicHelper) — Space Grotesk is new here.
- **Navigation:** flat white bottom tab bar with a soft top border and
  a violet pill on the active tab. Tabs: Today, Log, Coach, Settings.
  On ≥840dp it becomes a slim white left rail with the same violet pill.
  This is a fourth distinct navigation chrome after the floating glass
  pill (FridgeToMeal/MediGuide), top segmented tabs (SplitEase), dark
  ink bar (CivicHelper) and flat labeled bar (PlantDoctor).
- **Hero:** data hero — a big SVG budget ring (spent today vs daily
  budget, default $50, editable in Settings) with the big bold spent
  number in the centre; a coach tip card below; quick-add category
  chips; today's entries as a timeline. NO photo hero.
- **Refresh motif:** a piggy bank filling — coins drop into a violet
  piggy bank silhouette as the user pulls; past the threshold, the fill
  loop plays while data returns. On web the same animation is wired to
  a header refresh button. Never the stock spinner.
- **Buttons:** violet gradient primary with soft glow, frosted-glass
  ghost pills; Reanimated spring press to ~0.95 with overshoot settle;
  light haptic on primary actions (mobile only); bouncing-dot loading
  states; chips POP (scale bounce) when selected.
- **Glass:** every frosted surface uses the two-layer structure (outer
  view background + shadow, inner overflow-hidden view clipping the
  blur) so Android never paints a hard white plate.

## Tokens (lib/theme.ts)

- Colors: see palette above; `primarySoft #E4DBFB`, `primaryPale
  #F1EDFD`, `accentSoft #EFFBD9`, `aurora [#FBF8F3, #F1EDFD, #EFE9F9]`.
- Category colors: Food `#E07840`, Transport `#3E6B8E`, Shopping
  `#B23A48`, Fun `#8B5CF6`, Bills `#5A2EE6`, Health `#65A30D`, Other
  `#8B8496`.
- Type: display 42/56 Space Grotesk 700, title 24, subtitle 17, body
  15/22, caption 12, label 11. Spacing 8-point grid. Radii: cards 30,
  sheets 38, pills fully round, inputs 24.
- Breakpoints: <600 phones (single column), 600–840 large phone /
  foldable folded, 840–1280 two-pane (Today left, Log right), ≥1280
  centred shell (max 1120).

## Screen inventory (full flow)

1. **Splash** — paper background, violet rounded square with white B
   and lime coin (generated asset).
2. **Welcome** — piggy bank graphic (violet panel, white piggy circle,
   lime coin, SAVING stamp), four options: Continue with Google /
   Create account / Log in (+ Forgot password) / Continue without an
   account.
3. **Today (home)** — greeting, data hero ring, dark stat strip (week
   total / days under budget / entries today), coach tip card with
   DEMO/LIVE badge, quick-add category chips, today's timeline.
4. **Log** — add-expense sheet (amount, category chips, note, date)
   + history grouped by day with day totals + one-tap re-use list.
   Two-pane on ≥840dp: form left, history right.
5. **Expense detail** — big amount, category glyph, date, note, demo
   note when seeded, delete, "log a similar expense".
6. **Coach** — summary card (DEMO/LIVE badge), weekly bar chart (red
   bars over budget), three numbered tips, category share bars.
7. **Settings** — profile editor (photo, display name, email, sign-in
   method, password reset, sign out), daily budget editor, history
   with one-tap open + clear, services status, version (reads
   app.json), clear demo data.
8. **Help** — four steps, "what this is not" (not financial advice),
   demo vs live explainer, privacy, about.
9. **Empty/error states** — no expenses today, no spending this week,
   expense not found, amount/date validation with a next step.

## Transition & animation plan

- Splash → Welcome → Today: slide from right (expo-router stack).
- Tab changes: content fades/slides with `FadeInDown` spring, staggered
  0/60/120/180ms on Today sections.
- Ring: arc springs to its value (Reanimated spring, damping 16) on
  every spend change.
- Cards: staggered `FadeInDown` rises; chips pop on select; buttons
  spring to 0.95 on press with haptic.
- Pull-to-refresh: piggy bank drops in scrubbed by finger distance,
  coins drop and the bank fills lime past the threshold, content
  settles with a spring and cards re-enter staggered.
- State-changing taps show feedback where the user is looking: Log
  re-use pre-fills the form, scrolls to it and confirms in place;
  Today selection shows the expense on the right pane (two-pane) and a
  visible notice; save confirms with the new budget state in the notice.

## Self-check scores (quality / distinctness)

Honest per-screen scores against the 8 shared premium rules and the
question "could this be mistaken for a previous app?":

| Screen | Quality | Distinctness | Notes |
|---|---|---|---|
| Today (ring hero) | 90% | 95% | No previous app has a data-ring hero; violet + lime is new. The dark stat strip echoes CivicHelper's, but the ring + coach card + chips make the screen unmistakable. |
| Coach | 90% | 92% | Weekly bars + numbered lime tips; no equivalent screen in any earlier app. |
| Log | 88% | 90% | Sheet + grouped timeline; closest relative is SplitEase's ledger, but the violet flat tab bar, chips and day totals read differently. |
| Expense detail | 88% | 88% | Clean card layout; glyph chip + big violet amount is new. |
| Welcome | 88% | 90% | Piggy graphic on a violet panel; nothing like the stamp/letter art of CivicHelper. |
| Settings / Help | 85% | 85% | Standard account screens by design; violet tokens and the daily-budget editor keep them on-identity. |

No screen shares a home structure, navigation chrome or display font
with SplitEase (navy/gold ledger, Fraunces, segmented tabs), CivicHelper
(stamp red/blue paper trail, Archivo, dark ink bar) or PlantDoctor
(terracotta/sage dashboard grid, Bricolage Grotesque).

## Accounts

Standard system from day one (lib/store.tsx, lib/firebase.ts,
lib/firebase.native.ts): Welcome gate, Google + Email/Password
(email-link OFF), persistence via the platform-split Firebase module
(scoped @firebase/* on native, verified in the Android export bundle),
profile editor, per-user data under users/{uid} with owner-only rules,
history one-tap re-use + clear-history. No Firebase project exists yet
— TODO-BUDGETBUDDY-* placeholders, firebaseConfigured=false.

## Backend

Java Spring Boot 3.3.5 (backend/): POST /api/coach, GET /api/health.
Gemini gemini-3.5-flash-lite via the OpenAI-compatible endpoint, key
from GEMINI_API_KEY server-side only. Demo fallback (rule-based coach,
same rules as lib/coach.ts) when no key is set. 13 tests, all passing.
Build-verified locally; NOT hosted.
