-- ==============================================================================
-- KEYCLASH — ENABLE REALTIME FOR ROOMS (Migration 0005)
-- Run this in the Supabase SQL Editor after 0001-0004.
--
-- ROOT CAUSE: room-lobby.tsx subscribes to `postgres_changes` on
-- room_participants and rooms, but neither table was ever added to the
-- `supabase_realtime` publication. Without that, Postgres never emits the
-- change events Realtime's postgres_changes feature listens for — so the
-- lobby's participant list only ever reflected whatever existed at the
-- moment the page first loaded, with no way to learn about anyone who
-- joined afterward. This is why the host's view froze at "1 participant"
-- while the second player's own fresh page load happened to see both rows
-- already in the database.
--
-- Presence (used by the quick-match ranked lobby) and Broadcast (used by
-- the actual race countdown/progress) are unaffected by this — they don't
-- depend on the Postgres replication publication at all, which is exactly
-- why those flows worked while this one didn't.
-- ==============================================================================

alter publication supabase_realtime add table public.room_participants;
alter publication supabase_realtime add table public.rooms;
