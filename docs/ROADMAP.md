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

## ✅ M2.1 — Timer-based race engine & full stats (this delivery)

- [x] Fixed-duration Time mode (15/30/60/120s) — nobody's finish ends the
      match for anyone else; every player races the identical countdown
- [x] Words mode (10/25/50/100 words) and Zen mode (untimed, manual-end)
- [x] Extensible mode-config architecture — Quote/Numbers/Punctuation/
      Programming are additions to this, not rewrites (same pattern as the
      AI provider factory)
- [x] Full stats engine: WPM, raw WPM, accuracy, consistency, correct/
      incorrect words, keystrokes, mistakes, completion%
- [x] Reusable Results screen showing the full stat breakdown, used by
      practice and ranked
- [x] Ranked matches now run the full synced timer for both players — a
      finish no longer ends the match early for the opponent

**Explicitly deferred, each its own real batch:**

- **Quote/Numbers/Punctuation/Programming content banks** — needs genuine
  content curation (a real quote corpus, sensible number formats, code
  snippets across a couple languages), not just wiring
- **Settings panel + localStorage persistence** — font size, sound effects,
  keyboard sound, caret style, live WPM/accuracy toggles, restart shortcut,
  language selection
- **Room-based multiplayer** — create room, invite friends, per-room mode/
  timer selection, a Ready step before countdown, >2-player leaderboard.
  Current ranked flow is still 1v1 quick-match only.
- Ranked mode/duration selection UI (currently fixed at 30s Time mode —
  will be chosen by whoever creates the room once rooms exist)

## ✅ M2.2 — Content modes, settings, and room multiplayer (this delivery)

- [x] Quote, Numbers, Punctuation modes — real generators, wired into
      Practice mode's UI alongside Time/Words/Zen
- [x] Settings panel (`/settings`) with localStorage persistence: font size,
      caret style (line/block/underline), keystroke sound (synthesized, no
      audio files), live WPM/accuracy toggles, restart shortcut — wired into
      the race engine, deliberately **not** wired into ranked matches (no
      bailing out of a losing race via shortcut)
- [x] Room-based multiplayer: create a room with chosen mode/duration, get a
      shareable 6-character code, join by code, per-room Ready step, host
      starts once everyone's ready — reuses the exact same race room and
      Elo/anti-cheat pipeline as quick-match (`createRankedMatch()` helper
      shared between both paths, no duplicated logic)

**Still genuinely deferred:**

- **Programming mode** — needs real syntax-aware content and probably
  syntax highlighting; the mode-config architecture is ready for it
  (`ModeNotImplementedError` will point here when someone tries to select
  it), but the content itself isn't built
- **Full theme system** (multiple color palettes, not just caret style) —
  today's settings cover font/caret/sound/shortcuts, not a theme switcher
- **>2-player rooms** — the current `rooms`/`room_participants` schema
  supports N participants structurally, but the race itself (matches table's
  hardcoded `player_one_id`/`player_two_id` columns, the race room UI, Elo
  update logic) is still strictly 1v1. Real N-player races need a
  `match_participants` table replacing those two fixed columns — a schema
  migration and race-room rewrite, not a small addition
- **Rating collusion safeguard for rooms** — room races affect Elo rating
  exactly like quick-match does; two friends could currently trade wins to
  inflate one account's rating. Worth a design pass before this becomes a
  real product, not urgent for early testing

## ✅ M2.3 — Dashboard, social leaderboards, custom modes, accessibility settings (this delivery)

- [x] Dashboard: avg/highest WPM, total races, streak, WPM trend graph, 6 achievements (computed live, no separate achievements table needed yet)
- [x] Daily streak tracking (`profiles.current_streak`/`longest_streak`)
- [x] Weekly/Monthly leaderboards (rating-delta aggregation over the period)
- [x] Friends system: send/accept requests, Friends leaderboard tab, username search across all leaderboard tabs
- [x] Custom Text mode (paste your own text)
- [x] Difficulty (Normal/Expert/Master — Expert+Master end the race on first mistake)
- [x] Blind Mode, Focus Mode, Animation Speed settings
- [x] Forgot Password (real Supabase reset-password-by-email flow) + Remember Me (approximated — see note below)
- [x] Ctrl+Enter restart shortcut (alongside the existing Tab/Escape choice)

**Honest simplifications, not oversights:**

- **Language selector** shows Spanish/French as real options but they're disabled — no word-bank content exists for them yet, same pattern as Programming mode
- **Weekly/Monthly leaderboards** aggregate in JS from the `matches` table rather than a SQL function or scheduled snapshot job — fine at current scale, worth revisiting if match volume grows large
- **Remember Me** can't do a true persistent-vs-session storage swap (Supabase's client storage adapter is fixed at creation, not per sign-in) — unchecking it instead signs you out on tab/window close, a close approximation, not the exact same mechanism
- **Achievements** are a small fixed set computed from existing profile stats, not a flexible/extensible achievement system with its own table

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
