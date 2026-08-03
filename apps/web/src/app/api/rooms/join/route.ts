import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

interface JoinRoomBody {
  code: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as JoinRoomBody;
  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Room code is required" }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const { data: room } = await service.from("rooms").select("*").eq("code", code).single();
  if (!room) {
    return NextResponse.json({ error: "No room found with that code" }, { status: 404 });
  }
  if (room.status !== "waiting") {
    return NextResponse.json({ error: "That room has already started or ended" }, { status: 409 });
  }

  const { count } = await service
    .from("room_participants")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  // Two-player rooms for now — a room-level participant cap check here is
  // the natural place to raise this limit once >2-player races (a schema
  // change beyond this batch) land.
  if ((count ?? 0) >= 2) {
    const { data: existing } = await service
      .from("room_participants")
      .select("player_id")
      .eq("room_id", room.id)
      .eq("player_id", user.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "That room is already full" }, { status: 409 });
    }
  }

  await service
    .from("room_participants")
    .upsert({ room_id: room.id, player_id: user.id, is_ready: false });

  return NextResponse.json({
    roomId: room.id,
    modeKind: room.mode_kind,
    durationSeconds: room.duration_seconds,
    wordTarget: room.word_target,
    hostId: room.host_id,
  });
}
