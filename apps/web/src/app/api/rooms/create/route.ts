import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

interface CreateRoomBody {
  modeKind: "time" | "words";
  durationSeconds?: number;
  wordTarget?: number;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids ambiguous codes read aloud or handwritten

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as CreateRoomBody;
  const service = createServiceRoleClient();

  // Retry on the (very unlikely) chance of a code collision rather than
  // pre-checking uniqueness — the unique constraint on `code` is the real
  // guarantee, this just gives us a couple of free retries around it.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data: room, error } = await service
      .from("rooms")
      .insert({
        code,
        host_id: user.id,
        mode_kind: body.modeKind,
        duration_seconds: body.modeKind === "time" ? (body.durationSeconds ?? 30) : null,
        word_target: body.modeKind === "words" ? (body.wordTarget ?? 25) : null,
        status: "waiting",
      })
      .select()
      .single();

    if (!error && room) {
      await service
        .from("room_participants")
        .insert({ room_id: room.id, player_id: user.id, is_ready: false });
      return NextResponse.json({ code: room.code, roomId: room.id });
    }
    lastError = error;
  }

  console.error("Room creation failed after retries:", lastError);
  return NextResponse.json({ error: "Failed to create room, please try again" }, { status: 500 });
}
