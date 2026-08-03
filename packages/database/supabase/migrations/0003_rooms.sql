-- ==============================================================================
-- KEYCLASH — ROOMS (Migration 0003)
-- Run this in the Supabase SQL Editor after 0001_init.sql and 0002_match_stats.sql.
-- ==============================================================================

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  mode_kind text not null default 'time',
  duration_seconds integer,
  word_target integer,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  match_id uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now()
);

create index rooms_code_idx on public.rooms (code);

create table public.room_participants (
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;

-- Rooms are found by their code (needed for the join flow), so reads are
-- public — same trust model as matches/leaderboards elsewhere in this
-- schema. All writes (create/join/ready/start) go through service-role API
-- routes, never directly from the client, so no insert/update policy is
-- granted here.
create policy "rooms are publicly readable"
  on public.rooms for select using (true);

create policy "room participants are publicly readable"
  on public.room_participants for select using (true);
