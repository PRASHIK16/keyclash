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

## ✅ M2 — Ranked & real-time matchmaking (this delivery)

- [x] Realtime presence-based matchmaking lobby (no server worker process needed)
- [x] Synchronized 3-2-1 countdown via Realtime broadcast
- [x] Live opponent progress bar during the race
- [x] Server-side checkpoint-based result derivation (never trusts a client-claimed WPM for ranked)
- [x] Elo rating update wired end-to-end, idempotent match finalization
- [x] Ranked mode unlocked in the Play hub

**Known, deliberate limitations carried into M3** (not bugs — genuine scope
cuts to ship M2 in one focused batch):

- Pairing is join-order only, not rating-banded — a 900-rated and a
  2000-rated player can be paired together. Skill-based matchmaking bands
  are a small addition on top of the existing lobby, planned for M3.
- No abandonment/forfeit handling yet — if an opponent closes their tab
  mid-race, the match stays `in_progress` indefinitely rather than
  auto-resolving. A grace-period timeout is the fix, planned for M3.
- Single global lobby (no region or rating separation) — fine at low
  concurrent user counts, revisit if/when queue times become a problem.

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
