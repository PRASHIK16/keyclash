# Roadmap

## ✅ M1 — Core loop (this delivery)

- [x] Supabase auth (email/password), auto-profile-creation trigger
- [x] Full database schema + RLS policies
- [x] Elo rating engine + rank tiers
- [x] Anti-cheat validation logic (ready for ranked mode to call)
- [x] XP/level/coin progression math
- [x] Practice mode (Classic) — fully working typing race, live WPM/accuracy
- [x] Daily Challenge — one fixed test per day, one attempt enforced at the DB level
- [x] Global leaderboard
- [x] Public profile pages with match history
- [x] Dark, competitive-gaming visual identity (violet + electric lime)

## 🔜 M2 — Ranked & more modes

- **Ranked 1v1 real-time matchmaking** — Supabase Realtime presence-based
  lobby, deterministic pairing, live race room, checkpoint-based anti-cheat
  validation wired to the Elo engine (all the underlying math already ships
  in M1 — `packages/game-engine` — this milestone is the matchmaking +
  real-time UI layer on top of it)
- Sprint, Survival, Coding-syntax modes
- Weekly + country leaderboards, achievements
- Zen mode (untimed, no-pressure variant of practice)

## 🔜 M3 — Social & competitive structure

- Guilds/typing clubs
- Spectator mode
- Tournaments, team battles
- Friends system (schema already exists — `friendships` table — UI not yet built)

## 🔜 M4 — AI & analytics

- AI Coach, personalized weakness detection
- Typing heatmaps, mistake pattern analysis
- Dynamic difficulty recommendations

## 🔜 M5 — Monetization

- Season Pass
- Cosmetic store (schema already exists — `cosmetics`/`user_cosmetics` tables)
- Corporate/school plans, affiliate program
