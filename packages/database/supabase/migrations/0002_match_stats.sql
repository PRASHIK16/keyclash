-- ==============================================================================
-- KEYCLASH — MODE CONFIG + FULL STATS (Migration 0002)
-- Run this in the Supabase SQL Editor after 0001_init.sql.
-- ==============================================================================

alter table public.matches
  add column if not exists mode_kind text not null default 'time',
  add column if not exists duration_seconds integer,
  add column if not exists word_target integer,
  add column if not exists player_one_stats jsonb,
  add column if not exists player_two_stats jsonb;

comment on column public.matches.mode_kind is
  'time | words | zen | quote | numbers | punctuation | programming — see packages/game-engine/src/mode-config.ts';

comment on column public.matches.player_one_stats is
  'Full stat breakdown (rawWpm, consistency, correctWords, incorrectWords, '
  'totalKeystrokes, correctKeystrokes, mistakes, completionPct) for display. '
  'For ranked matches this is client-reported and NOT used to determine the '
  'winner or rating change — those are derived strictly from server-timestamped '
  'match_events checkpoints (see api/match/ranked/submit). Same trust model as '
  'practice mode: display stats are lighter-validated, competitive rating never is.';

comment on column public.matches.player_two_stats is 'See player_one_stats.';
