-- ==============================================================================
-- KEYCLASH — INITIAL SCHEMA (Migration 0001)
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query),
-- or via `supabase db push` if you set up the Supabase CLI later.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES
-- One row per auth.users row (Supabase's built-in auth table). We can't modify
-- auth.users directly, so profile data (rating, xp, coins, username) lives here,
-- linked 1:1 by id.
-- ------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,

  rating integer not null default 1000,
  peak_rating integer not null default 1000,
  xp integer not null default 0,
  level integer not null default 1,
  coins integer not null default 0,

  matches_played integer not null default 0,
  matches_won integer not null default 0,

  caret_color text not null default '#7C3AED',
  active_theme text not null default 'default',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_rating_idx on public.profiles (rating desc);
create index profiles_username_idx on public.profiles (username);

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Player')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- MATCHES
-- One row per completed race — both ranked 1v1 and solo practice/daily.
-- ------------------------------------------------------------------------------
create type public.match_mode as enum ('ranked_1v1', 'practice_classic', 'practice_zen', 'daily_challenge');
create type public.match_status as enum ('in_progress', 'completed', 'abandoned');

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  mode public.match_mode not null,
  status public.match_status not null default 'in_progress',
  text_content text not null,

  -- Nullable: solo modes only have player_one.
  player_one_id uuid references public.profiles(id) on delete set null,
  player_two_id uuid references public.profiles(id) on delete set null,

  player_one_wpm numeric(6, 2),
  player_one_accuracy numeric(5, 2),
  player_two_wpm numeric(6, 2),
  player_two_accuracy numeric(5, 2),

  winner_id uuid references public.profiles(id) on delete set null,
  player_one_rating_delta integer,
  player_two_rating_delta integer,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index matches_player_one_idx on public.matches (player_one_id, created_at desc);
create index matches_player_two_idx on public.matches (player_two_id, created_at desc);

-- ------------------------------------------------------------------------------
-- MATCH EVENTS (anti-cheat foundation)
-- Server-timestamped keystroke checkpoints. The client reports its local WPM,
-- but we never trust it outright — this table lets a server-side validator
-- recompute WPM from checkpoint timestamps and reject results that don't
-- plausibly match (e.g. a client claiming 250 WPM with only 3 checkpoints).
-- ------------------------------------------------------------------------------
create table public.match_events (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  correct_chars integer not null,
  total_chars integer not null,
  elapsed_ms integer not null,
  server_received_at timestamptz not null default now()
);

create index match_events_match_idx on public.match_events (match_id, player_id, elapsed_ms);

-- ------------------------------------------------------------------------------
-- DAILY CHALLENGES
-- One fixed challenge text per day, same for every player.
-- ------------------------------------------------------------------------------
create table public.daily_challenges (
  challenge_date date primary key,
  text_content text not null,
  rule_description text not null default 'Standard typing test — accuracy and speed both count.',
  created_at timestamptz not null default now()
);

create table public.daily_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null references public.daily_challenges(challenge_date) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  wpm numeric(6, 2) not null,
  accuracy numeric(5, 2) not null,
  xp_awarded integer not null default 0,
  coins_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique (challenge_date, player_id)
);

create index daily_attempts_leaderboard_idx on public.daily_challenge_attempts (challenge_date, wpm desc);

-- ------------------------------------------------------------------------------
-- LEADERBOARD SNAPSHOTS
-- Per your brief: "fresh competitive leaderboard every 3 days, preserve
-- history." We snapshot `profiles.rating` into this table on a cadence
-- (via a scheduled Supabase Edge Function or manual run for V1) rather than
-- ever mutating past standings.
-- ------------------------------------------------------------------------------
create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  player_id uuid not null references public.profiles(id) on delete cascade,
  rating_at_snapshot integer not null,
  rank_position integer not null,
  created_at timestamptz not null default now()
);

create index leaderboard_snapshots_period_idx on public.leaderboard_snapshots (period_start, rank_position);

-- ------------------------------------------------------------------------------
-- COSMETICS
-- ------------------------------------------------------------------------------
create table public.cosmetics (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('caret_color', 'theme')),
  price_coins integer not null,
  preview_value text not null -- hex color for caret_color, theme slug for theme
);

create table public.user_cosmetics (
  player_id uuid not null references public.profiles(id) on delete cascade,
  cosmetic_id text not null references public.cosmetics(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (player_id, cosmetic_id)
);

-- ------------------------------------------------------------------------------
-- FRIENDSHIPS
-- ------------------------------------------------------------------------------
create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- Supabase exposes tables directly to the browser via its client library, so
-- RLS is the actual authorization layer here — not optional the way it was
-- "nice to have later" in the previous Postgres-only setup.
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.daily_challenge_attempts enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.cosmetics enable row level security;
alter table public.user_cosmetics enable row level security;
alter table public.friendships enable row level security;

-- Profiles: anyone can read (public profiles/leaderboards), only the owner can update.
create policy "profiles are publicly readable"
  on public.profiles for select using (true);
create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Matches: participants can read their own matches; everyone can read completed
-- matches for spectating/leaderboard context. Inserts/updates go through the
-- service role (API routes) only — never directly from the client — so no
-- insert/update policy is granted to the anon/authenticated roles here.
create policy "matches are publicly readable"
  on public.matches for select using (true);

-- Match events: a player can only insert their own keystroke checkpoints.
create policy "players can insert their own match events"
  on public.match_events for insert with check (auth.uid() = player_id);
create policy "players can read match events for their own matches"
  on public.match_events for select using (
    auth.uid() = player_id
    or auth.uid() in (
      select player_one_id from public.matches where id = match_id
      union
      select player_two_id from public.matches where id = match_id
    )
  );

-- Daily challenges: publicly readable.
create policy "daily challenges are publicly readable"
  on public.daily_challenges for select using (true);

-- Daily challenge attempts: publicly readable (leaderboard), insert only your own.
create policy "daily attempts are publicly readable"
  on public.daily_challenge_attempts for select using (true);
create policy "players can insert their own daily attempt"
  on public.daily_challenge_attempts for insert with check (auth.uid() = player_id);

-- Leaderboard snapshots: publicly readable, written only by the service role.
create policy "leaderboard snapshots are publicly readable"
  on public.leaderboard_snapshots for select using (true);

-- Cosmetics catalogue: publicly readable.
create policy "cosmetics are publicly readable"
  on public.cosmetics for select using (true);

-- User cosmetics: publicly readable (shows off on profiles), insert only via service role.
create policy "user cosmetics are publicly readable"
  on public.user_cosmetics for select using (true);

-- Friendships: only the two people involved can see the row.
create policy "users can view their own friendships"
  on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "users can create friend requests"
  on public.friendships for insert with check (auth.uid() = requester_id);
create policy "addressee can update friendship status"
  on public.friendships for update using (auth.uid() = addressee_id);

-- ==============================================================================
-- SEED DATA — starter cosmetics + today's daily challenge
-- ==============================================================================
insert into public.cosmetics (id, name, kind, price_coins, preview_value) values
  ('caret_violet', 'Violet Caret', 'caret_color', 0, '#7C3AED'),
  ('caret_crimson', 'Crimson Caret', 'caret_color', 150, '#DC2626'),
  ('caret_lime', 'Lime Caret', 'caret_color', 150, '#84CC16'),
  ('caret_gold', 'Gold Caret', 'caret_color', 500, '#F59E0B'),
  ('theme_default', 'Default', 'theme', 0, 'default'),
  ('theme_midnight', 'Midnight', 'theme', 300, 'midnight');

insert into public.daily_challenges (challenge_date, text_content, rule_description) values
  (current_date, 'The quick brown fox jumps over the lazy dog while champions are forged one keystroke at a time.', 'Standard typing test — accuracy and speed both count.');
