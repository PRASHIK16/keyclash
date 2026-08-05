-- ==============================================================================
-- KEYCLASH — STREAKS (Migration 0004)
-- Run this in the Supabase SQL Editor after 0001-0003.
-- ==============================================================================

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_active_date date;

comment on column public.profiles.current_streak is
  'Consecutive days with at least one completed race. Reset to 1 if a day is missed, incremented if the last active day was yesterday, unchanged if already updated today. See apps/web/src/lib/streak.ts.';
comment on column public.profiles.longest_streak is 'High-water mark of current_streak, never decreases.';
