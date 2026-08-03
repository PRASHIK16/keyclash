import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { RaceRoom } from "@/components/race-room";

export default async function RaceRoomPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?redirectTo=/play/ranked/${matchId}`);

  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) notFound();

  if (match.player_one_id !== user.id && match.player_two_id !== user.id) {
    redirect("/play/ranked");
  }

  const isPlayerOne = match.player_one_id === user.id;
  const opponentId = isPlayerOne ? match.player_two_id : match.player_one_id;

  const [{ data: ownProfile }, { data: opponentProfile }] = await Promise.all([
    supabase.from("profiles").select("caret_color").eq("id", user.id).single(),
    opponentId
      ? supabase.from("profiles").select("username").eq("id", opponentId).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <RaceRoom
          matchId={matchId}
          textContent={match.text_content}
          modeKind={match.mode_kind}
          durationSeconds={match.duration_seconds}
          userId={user.id}
          isPlayerOne={isPlayerOne}
          opponentUsername={opponentProfile?.username ?? "opponent"}
          caretColor={ownProfile?.caret_color ?? "#C6FF3D"}
        />
      </main>
    </div>
  );
}
