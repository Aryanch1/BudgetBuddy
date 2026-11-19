# BudgetBuddy

**Know where the money went.** A daily spending log with a friendly AI coach summary — simple money habits, no bank connection needed.

Log what you spend, watch the daily budget ring, and let the coach keep your week honest — one small entry at a time. Built for students, roommates and first-job savers who want a calmer relationship with money.

## Features

- **Daily budget ring** — today's spending against your daily budget (default $50, editable in Settings), with the big spent number in the centre.
- **Quick log** — tap a category chip, type the amount, add a note. Ten seconds.
- **AI coach** — a friendly summary of the last 7 days, a weekly bar chart, and three practical tips built from the numbers you actually logged.
- **History** — expenses grouped by day with day totals, and one-tap re-use of past expenses.
- **Accounts** — sign in with Google or email, or continue as a guest. Signed-in users stay signed in; expenses sync per account.
- **Premium design** — deep violet and lime on warm paper, Space Grotesk display type, spring-physics animations, a piggy-bank pull-to-refresh, frosted glass cards. Works on phones, tablets, foldables and desktop.

## Live web

Live link coming soon — the app is built locally and ready to publish.

## Design

Figma: https://www.figma.com/design/EWAwlD58VlOgXAbjLn4bnc — "BudgetBuddy — Daily App"

## Tech stack

- React Native + Expo SDK 58 + TypeScript (one codebase: Android, iOS, web)
- Gemini AI (`gemini-3.5-flash-lite`) for the coach, via a Java Spring Boot service (`backend/`, key server-side only) — honest demo coach mode when the backend is not deployed
- Firebase Authentication + Firestore for accounts and sync
- react-native-reanimated, expo-blur, expo-haptics, expo-linear-gradient

## Run it

```sh
npm install
npm run web        # web
npm run android    # Android (Expo Go / emulator)
npm run ios        # iOS (Expo Go)
```

Backend (Java 17):

```sh
cd backend
./mvnw spring-boot:run   # serves on http://localhost:8080
```

Set `EXPO_PUBLIC_API_URL` to the backend origin to use the live coach; without it the app runs its on-device demo coach. `GEMINI_API_KEY` is set server-side only, never in the app or repo — see `.env.example`.

## License

MIT License — Copyright (c) 2026 Aryanmouli Cherupalli
