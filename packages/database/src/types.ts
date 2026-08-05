/**
 * Hand-written to match packages/database/supabase/migrations/0001_init.sql
 * exactly. If you later install the Supabase CLI, you can regenerate this
 * file automatically with:
 *   supabase gen types typescript --project-id <your-project-ref> > src/types.ts
 * until then, keep this file in sync by hand whenever the SQL schema changes.
 */

export type MatchMode = "ranked_1v1" | "practice_classic" | "practice_zen" | "daily_challenge";
export type MatchStatus = "in_progress" | "completed" | "abandoned";
export type FriendshipStatus = "pending" | "accepted";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  rating: number;
  peak_rating: number;
  xp: number;
  level: number;
  coins: number;
  matches_played: number;
  matches_won: number;
  caret_color: string;
  active_theme: string;
  created_at: string;
  updated_at: string;
};

export type PlayerRaceStats = {
  rawWpm: number;
  consistency: number;
  correctWords: number;
  incorrectWords: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  mistakes: number;
  completionPct: number;
};

export type Match = {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  text_content: string;
  mode_kind: string;
  duration_seconds: number | null;
  word_target: number | null;
  player_one_id: string | null;
  player_two_id: string | null;
  player_one_wpm: number | null;
  player_one_accuracy: number | null;
  player_one_stats: PlayerRaceStats | null;
  player_two_wpm: number | null;
  player_two_accuracy: number | null;
  player_two_stats: PlayerRaceStats | null;
  winner_id: string | null;
  player_one_rating_delta: number | null;
  player_two_rating_delta: number | null;
  created_at: string;
  completed_at: string | null;
};

export type MatchEvent = {
  id: number;
  match_id: string;
  player_id: string;
  correct_chars: number;
  total_chars: number;
  elapsed_ms: number;
  server_received_at: string;
};

export type DailyChallenge = {
  challenge_date: string;
  text_content: string;
  rule_description: string;
  created_at: string;
};

export type DailyChallengeAttempt = {
  id: string;
  challenge_date: string;
  player_id: string;
  wpm: number;
  accuracy: number;
  xp_awarded: number;
  coins_awarded: number;
  created_at: string;
};

export type LeaderboardSnapshot = {
  id: string;
  period_start: string;
  period_end: string;
  player_id: string;
  rating_at_snapshot: number;
  rank_position: number;
  created_at: string;
};

export type Cosmetic = {
  id: string;
  name: string;
  kind: "caret_color" | "theme";
  price_coins: number;
  preview_value: string;
};

export type UserCosmetic = {
  player_id: string;
  cosmetic_id: string;
  unlocked_at: string;
};

export type RoomStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export type Room = {
  id: string;
  code: string;
  host_id: string;
  mode_kind: string;
  duration_seconds: number | null;
  word_target: number | null;
  status: RoomStatus;
  match_id: string | null;
  created_at: string;
};

export type RoomParticipant = {
  room_id: string;
  player_id: string;
  is_ready: boolean;
  joined_at: string;
};

export type Friendship = {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

/**
 * Supabase's `createClient<Database>()` generic uses this shape to type
 * every `.from("table_name")` call. Row = what select returns, Insert = what
 * you must/can provide on insert, Update = what you can patch.
 */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: string;
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "username">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: Partial<Match> & Pick<Match, "mode" | "text_content">;
        Update: Partial<Match>;
        Relationships: [];
      };
      match_events: {
        Row: MatchEvent;
        Insert: Omit<MatchEvent, "id" | "server_received_at">;
        Update: Partial<MatchEvent>;
        Relationships: [];
      };
      daily_challenges: {
        Row: DailyChallenge;
        Insert: DailyChallenge;
        Update: Partial<DailyChallenge>;
        Relationships: [];
      };
      daily_challenge_attempts: {
        Row: DailyChallengeAttempt;
        Insert: Omit<DailyChallengeAttempt, "id" | "created_at">;
        Update: Partial<DailyChallengeAttempt>;
        Relationships: [];
      };
      leaderboard_snapshots: {
        Row: LeaderboardSnapshot;
        Insert: Omit<LeaderboardSnapshot, "id" | "created_at">;
        Update: Partial<LeaderboardSnapshot>;
        Relationships: [];
      };
      cosmetics: {
        Row: Cosmetic;
        Insert: Cosmetic;
        Update: Partial<Cosmetic>;
        Relationships: [];
      };
      user_cosmetics: {
        Row: UserCosmetic;
        Insert: Omit<UserCosmetic, "unlocked_at">;
        Update: Partial<UserCosmetic>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Pick<Friendship, "requester_id" | "addressee_id">;
        Update: Partial<Friendship>;
        Relationships: [];
      };
      rooms: {
        Row: Room;
        Insert: Partial<Room> & Pick<Room, "code" | "host_id">;
        Update: Partial<Room>;
        Relationships: [];
      };
      room_participants: {
        Row: RoomParticipant;
        Insert: Omit<RoomParticipant, "joined_at">;
        Update: Partial<RoomParticipant>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
