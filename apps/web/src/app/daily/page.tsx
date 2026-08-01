import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { DailySession } from "@/components/daily-session";
import { Card, CardContent } from "@keyclash/ui";

export default async function DailyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/daily");

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: challenge }, { data: profile }, { data: existingAttempt }] = await Promise.all([
    supabase.from("daily_challenges").select("*").eq("challenge_date", today).single(),
    supabase.from("profiles").select("caret_color").eq("id", user.id).single(),
    supabase
      .from("daily_challenge_attempts")
      .select("*")
      .eq("challenge_date", today)
      .eq("player_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Today&apos;s Challenge</h1>
        <p className="mt-1 text-kc-ink-muted">
          {challenge?.rule_description ?? "Standard typing test."}
        </p>

        <div className="mt-8">
          {!challenge ? (
            <p className="text-kc-ink-muted">
              No challenge configured for today yet — check back soon.
            </p>
          ) : existingAttempt ? (
            <Card className="mx-auto max-w-md text-center">
              <CardContent className="space-y-2 py-8">
                <p className="font-display text-3xl font-extrabold text-kc-accent">
                  {existingAttempt.wpm} wpm
                </p>
                <p className="text-kc-ink-muted">{existingAttempt.accuracy}% accuracy</p>
                <p className="text-xs text-kc-ink-muted">
                  You&apos;ve already completed today&apos;s challenge. Come back tomorrow.
                </p>
              </CardContent>
            </Card>
          ) : (
            <DailySession
              text={challenge.text_content}
              caretColor={profile?.caret_color ?? "#C6FF3D"}
              challengeDate={today}
            />
          )}
        </div>
      </main>
    </div>
  );
}
