# Keyclash

A competitive typing platform — ranked matches, daily challenges, and progression.
Where typists become champions.

> **This is Milestone 1 (M1)**: auth, profiles, practice mode, daily challenge,
> global leaderboard, and the rating/progression engine. Ranked 1v1 real-time
> matchmaking is the very next milestone — see `docs/ROADMAP.md`.

## Why this setup is simpler than a typical full-stack app

Auth, database, and real-time all live in **one Supabase project** — no Docker,
no local Postgres install, no ngrok, no separate webhook-sync step. Your local
setup is: create a free Supabase project (you already have one) → run one SQL
migration → `pnpm install` → two environment variables → `pnpm dev`.

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.1.0 --activate`, or `npm install -g pnpm`)
- A Supabase project (free tier) — you already have one

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Run the database migration**
   - Open your Supabase project dashboard → **SQL Editor** → **New query**
   - Paste the entire contents of `packages/database/supabase/migrations/0001_init.sql`
   - Click **Run**
   - This creates every table, the auto-profile-creation trigger, Row Level
     Security policies, and seeds starter cosmetics + today's daily challenge

3. **Get your Supabase API keys**
   - Dashboard → **Settings → API**
   - Copy the **Project URL**, the **anon public** key, and the **service_role secret** key

4. **Configure environment variables**

   ```bash
   cp .env.example apps/web/.env.local
   ```

   Paste in the three values from step 3.

5. **Run the app**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000`, sign up (this auto-creates your profile via the
   database trigger — no webhook, no waiting), and try **Practice** or **Daily Challenge**.

## Useful scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Run the app in dev mode       |
| `pnpm build`      | Build for production          |
| `pnpm lint`       | Lint everything               |
| `pnpm type-check` | Type-check everything         |
| `pnpm format`     | Format the repo with Prettier |

## Deployment

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → **Import Project** → select the repo
3. Vercel auto-detects Next.js — set the root directory to `apps/web`
4. Add the same three environment variables in Vercel's dashboard
5. Deploy — no server, no containers, no Docker image to maintain

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, anti-cheat approach, RLS model
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — M1 (this delivery) through M5
