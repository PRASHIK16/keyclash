import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Call this after ANY completed race (practice, daily, ranked — for both
 * players in ranked). Uses UTC date strings (YYYY-MM-DD) for "day" boundaries
 * — deliberately simple and consistent rather than per-user timezone-aware,
 * which would need storing each user's timezone and is a fair bit more
 * complexity for a marginal UX improvement at this stage.
 */
export async function updateStreak(userId: string): Promise<void> {
  const service = createServiceRoleClient();

  const { data: profile } = await service
    .from("profiles")
    .select("current_streak, longest_streak, last_active_date")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_active_date === today) return; // already counted today

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const continuingStreak = profile.last_active_date === yesterday;

  const newStreak = continuingStreak ? profile.current_streak + 1 : 1;
  const newLongest = Math.max(profile.longest_streak, newStreak);

  await service
    .from("profiles")
    .update({ current_streak: newStreak, longest_streak: newLongest, last_active_date: today })
    .eq("id", userId);
}
