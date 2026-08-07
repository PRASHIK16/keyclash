# Keyclash

A competitive typing platform inspired by Monkeytype's typing feel and Chess.com's ranked-progression model. Race against the clock, race against real opponents, climb a rating ladder, and track your improvement over time.

**Live demo:** _add your Vercel URL here_

## Features

- **Authentication** — email/password sign-up and sign-in via Supabase Auth, forgot-password email flow, protected routes, and a fresh-login-required session model (see [Authentication Model](#authentication-model) below)
- **Typing practice** — Time (15/30/60/120s), Words (10/25/50/100), Quote, Numbers, Punctuation, Zen, and Custom Text modes
- **Monkeytype-inspired UI** — dark theme, compact single-bar mode selector, 3-line scrolling word view, active-word highlighting, blinking caret (line/block/underline styles)
- **Live typing stats** — WPM, raw WPM, accuracy, consistency, correct/incorrect words, keystrokes, mistakes, completion %
- **Ranked 1v1 matchmaking** — real-time presence-based lobby, synchronized countdown, live opponent progress, Elo rating, server-side anti-cheat validation
- **Room-based multiplayer** — create a room, share a 6-character code, both players ready up, host starts the race
- **Daily Challenge** — one fixed test per day, same for everyone, one attempt enforced
- **Dashboard** — average/highest WPM, race history, WPM trend graph, daily streak, achievements
- **Leaderboards** — global, weekly, monthly, and friends, with username search
- **Social** — friend requests and a friends-only leaderboard
- **Settings** — font size, caret style, keystroke sound, live WPM/accuracy toggles, restart shortcut, difficulty (Normal/Expert/Master), blind mode, focus mode, animation speed — all persisted per device
- **Responsive design** — usable on desktop, tablet, and mobile

## Tech Stack

**Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
**Backend:** Next.js Route Handlers (API routes), Supabase Realtime (matchmaking, race sync, room lobbies)
**Database:** Supabase Postgres, with Row Level Security policies on every table
**Authentication:** Supabase Auth (email/password), enforced via Next.js middleware and per-page server-side checks
**Deployment:** Localhost for now (Vercel deployment supported — see [Deployment](#deployment))

## Folder Structure

```
keyclash/
├── apps/
│   └── web/                          # Next.js application
│       └── src/
│           ├── app/                  # App Router pages and API routes
│           │   ├── api/
│           │   │   ├── auth/signout/
│           │   │   ├── daily/submit/
│           │   │   ├── friends/{request,accept}/
│           │   │   ├── leaderboard/period/
│           │   │   ├── match/{practice,ranked}/
│           │   │   └── rooms/{create,join,ready,start}/
│           │   ├── auth/callback/
│           │   ├── daily/
│           │   ├── dashboard/
│           │   ├── forgot-password/
│           │   ├── leaderboard/
│           │   ├── play/{practice,ranked,room}/
│           │   ├── profile/[username]/
│           │   ├── reset-password/
│           │   ├── settings/
│           │   ├── sign-in/
│           │   └── sign-up/
│           ├── components/           # React components
│           ├── lib/                  # Supabase clients, settings hook, helpers
│           └── middleware.ts         # Session enforcement, route protection
├── packages/
│   ├── database/                     # Supabase migrations + hand-written TS types
│   ├── game-engine/                  # Elo rating, anti-cheat validation, stats math
│   ├── shared/                       # Word banks, mode config, settings types
│   └── ui/                           # Shared design-system components
└── docs/
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

## Installation

### Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.1.0 --activate`, or `npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (free tier is enough)

### Clone

```bash
git clone https://github.com/<your-username>/keyclash.git
cd keyclash
```

### Install

```bash
pnpm install
```

### Set up the database

Run every file in `packages/database/supabase/migrations/` **in order** (`0001_init.sql` through `0004_streaks.sql`) via your Supabase project's SQL Editor.

### Configure environment variables

```bash
cp .env.example apps/web/.env.local
```

Fill in the values — see [Environment Variables](#environment-variables) below.

### Run

This project has a single app (no separate backend server — API routes live inside the Next.js app):

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Set these in `apps/web/.env.local`:

| Variable                        | Description                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL (Settings → API)                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (Settings → API)                                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service_role secret key — **server-only, never expose to the browser** |
| `NEXT_PUBLIC_APP_URL`           | Your app's URL (`http://localhost:3000` for local dev)                          |

## Usage

1. **Sign up** with an email, password, and username
2. From **Play**, pick a mode:
   - **Practice** — no rating risk, choose Time/Words/Quote/Numbers/Punctuation/Zen/Custom
   - **Ranked 1v1** — matched live against another player, affects your rating
   - **Play with friends** — create or join a room by code
3. Check **Daily** for the day's shared challenge
4. Visit **Dashboard** for your stats, WPM trend, streak, and achievements
5. Check **Leaderboard** (Global/Weekly/Monthly/Friends) to see where you stand
6. Adjust **Settings** to personalize font size, caret style, sound, difficulty, and accessibility options (blind mode, focus mode, animation speed)

## Authentication Model

This project deliberately does **not** keep you signed in indefinitely across visits:

- Visiting the site's home page, sign-in page, or sign-up page **always** shows a fresh login/signup prompt — even if you were previously signed in, that session is ended the moment you land on one of those pages. There is no "remember me" option.
- Once signed in, your session remains valid for normal use (navigating between pages, refreshing the dashboard, etc.) until you either sign out or revisit the home/login pages.
- Every protected route (`/play`, `/settings`, and others) validates your session fresh on the server for every request — nothing is cached client-side and blindly trusted.
- **Sign out** clears the server-side session cookie and sweeps any Supabase-related client storage, then does a full page redirect to the sign-in page.

## Deployment

Currently run locally (`pnpm dev`). To deploy to Vercel:

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → **Add New Project** → select the repo
3. Set **Root Directory** to `apps/web`
4. Add the environment variables from [Environment Variables](#environment-variables)
5. Deploy
6. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to the allowed redirect URLs (needed for email confirmation and password reset links)

## Future Improvements

- Programming mode (real code snippets, syntax-aware content)
- Full theme system (multiple color palettes, not just caret style)
- True N-player rooms (currently capped at 2 — needs a `match_participants` table replacing the fixed two-player schema)
- Guilds/typing clubs, spectator mode, tournaments, team battles
- AI-powered coaching — weakness detection, mistake-pattern analysis, personalized practice recommendations
- Season pass, cosmetic store front-end (schema already supports it), corporate/school plans

## Author

**Prashik Dongre**
