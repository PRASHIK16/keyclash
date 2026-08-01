# Architecture

## Why Supabase instead of separate Auth + Postgres + webhooks

The previous project (Echo) used Clerk (auth) + a self-hosted/local Postgres +
Prisma + a webhook to sync the two. That's a legitimate architecture for a
B2B SaaS with complex organization/RBAC needs, but for Keyclash it introduced
real operational fragility that isn't inherent to the product — Docker/local
Postgres setup, ngrok tunneling for webhook delivery in dev, and a genuine
race condition between "Clerk says you're in this org" and "our database
knows it yet."

Supabase collapses auth and the database into one system: the session cookie
Supabase Auth issues **is** checked against the same Postgres instance your
data lives in, on every request, synchronously. There's no second system to
sync, so there's no sync race to have a bug in. The trade-off: you get Clerk's
polish on things like prebuilt organization management (which Keyclash
doesn't need — there are no multi-tenant orgs here, just individual players).

## Monorepo layout

```
keyclash/
├── apps/web/              # Next.js 14 app — everything for M1 lives here
├── packages/
│   ├── database/          # SQL migrations + hand-written TS types matching the schema
│   ├── game-engine/       # Elo rating, WPM/accuracy math, anti-cheat validation, XP curve
│   ├── ui/                 # Shared design-system components
│   └── shared/              # Cross-cutting constants (practice text pool, etc.)
└── docs/
```

## Authorization model: Row Level Security, not application-layer checks

Because the Supabase client library is used directly from the browser (not
just from a trusted server), **RLS policies are the actual security boundary**
— see the `alter table ... enable row level security` + `create policy`
statements at the bottom of `0001_init.sql`. Concretely:

- Anyone can **read** profiles, matches, leaderboards (public by design — this
  is a competitive platform, stats are meant to be visible)
- Only the row's owner can **update** their own profile
- Match results, rating changes, and XP/coin awards are written exclusively
  through Route Handlers using the **service role client**
  (`src/lib/supabase/service.ts`), which bypasses RLS deliberately — the
  server validates the result first (see anti-cheat below), then writes with
  elevated privileges. The browser is never granted direct write access to
  `matches`, `profiles.rating`, or `profiles.xp/coins` for exactly this reason.

## Anti-cheat approach (for ranked matches, milestone 2)

`packages/game-engine/src/validation.ts` recomputes WPM from
server-timestamped checkpoints (`match_events` table) rather than trusting a
client-reported final number outright. The core idea: the client periodically
reports `{correctChars, totalChars, elapsedMs}` during the race; Postgres
stamps `server_received_at` on arrival; the submit endpoint uses those
timestamps — which the client cannot forge — to compute an independent WPM
and rejects results that diverge too far from what the client claims, or that
exceed plausible human limits, or that have implausibly sparse checkpoint
cadence for the claimed duration.

## Practice mode's deliberately lighter validation

Practice results affect XP/coins but never the competitive rating, so M1
accepts client-reported WPM directly for practice (see
`api/match/practice/route.ts`) with only a sanity-range clamp (0-300 WPM).
This is a conscious trade-off, not an oversight — full checkpoint-based
validation is reserved for where it actually matters (ranked), keeping
practice mode's implementation simple.

## What's deferred to later milestones

- Ranked 1v1 real-time matchmaking (Supabase Realtime presence + broadcast)
- Sprint/Survival/Coding-syntax modes
- Guilds, spectator mode, tournaments
- AI Coach, weakness heatmaps
- Season Pass, monetization, corporate/school plans
