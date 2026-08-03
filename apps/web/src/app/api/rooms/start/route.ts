import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createRankedMatch } from "@/lib/create-ranked-match";

interface StartRoomBody {
  roomId: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as StartRoomBody;
  const service = createServiceRoleClient();

  const { data: room } = await service.from("rooms").select("*").eq("id", body.roomId).single();
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can start the race" }, { status: 403 });
  }
  if (room.status === "in_progress" && room.match_id) {
    // Idempotent: if the host's client retries this call (e.g. a duplicate
    // click), just return the already-created match rather than erroring.
    return NextResponse.json({ matchId: room.match_id });
  }
  if (room.status !== "waiting") {
    return NextResponse.json({ error: "Room is not in a startable state" }, { status: 409 });
  }

  const { data: participants } = await service
    .from("room_participants")
    .select("player_id, is_ready")
    .eq("room_id", room.id);

  if (!participants || participants.length < 2) {
    return NextResponse.json({ error: "Need at least 2 players to start" }, { status: 400 });
  }
  if (participants.some((p) => !p.is_ready)) {
    return NextResponse.json({ error: "Not everyone is ready yet" }, { status: 409 });
  }

  const otherPlayer = participants.find((p) => p.player_id !== user.id);
  if (!otherPlayer) {
    return NextResponse.json({ error: "Could not find an opponent" }, { status: 400 });
  }

  try {
    const { matchId } = await createRankedMatch({
      playerOneId: user.id,
      playerTwoId: otherPlayer.player_id,
      modeKind: room.mode_kind,
      durationSeconds: room.duration_seconds,
      wordTarget: room.word_target,
    });

    await service
      .from("rooms")
      .update({ status: "in_progress", match_id: matchId })
      .eq("id", room.id);

    return NextResponse.json({ matchId });
  } catch {
    return NextResponse.json({ error: "Failed to start the race" }, { status: 500 });
  }
}
