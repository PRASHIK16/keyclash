import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

interface AcceptBody {
  requesterId: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as AcceptBody;
  const service = createServiceRoleClient();

  const { error } = await service
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", body.requesterId)
    .eq("addressee_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to accept request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
