import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { RoomLobby } from "@/components/room-lobby";

export default async function RoomLobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?redirectTo=/play/room/${code}`);

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  if (!room) notFound();

  if (room.status === "in_progress" && room.match_id) {
    redirect(`/play/ranked/${room.match_id}`);
  }

  const { data: participant } = await supabase
    .from("room_participants")
    .select("player_id")
    .eq("room_id", room.id)
    .eq("player_id", user.id)
    .maybeSingle();

  if (!participant) {
    // Landed here without joining first (e.g. a raw URL) — send them
    // through the normal join flow instead of silently adding them.
    redirect("/play/room");
  }

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Room lobby</h1>
        <div className="mt-8">
          <RoomLobby
            roomId={room.id}
            code={room.code}
            modeKind={room.mode_kind}
            durationSeconds={room.duration_seconds}
            wordTarget={room.word_target}
            hostId={room.host_id}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
