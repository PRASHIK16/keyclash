import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

interface FriendRequestBody {
  username: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as FriendRequestBody;
  const service = createServiceRoleClient();

  const { data: target } = await service
    .from("profiles")
    .select("id")
    .eq("username", body.username.trim())
    .single();

  if (!target) {
    return NextResponse.json({ error: "No player with that username" }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "You can't friend yourself" }, { status: 400 });
  }

  const { error } = await service
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: target.id });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Friend request already sent" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
