import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

interface ReadyBody {
  roomId: string;
  ready: boolean;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as ReadyBody;
  const service = createServiceRoleClient();

  const { error } = await service
    .from("room_participants")
    .update({ is_ready: body.ready })
    .eq("room_id", body.roomId)
    .eq("player_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update ready state" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
