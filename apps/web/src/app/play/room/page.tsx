import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { RoomEntry } from "@/components/room-entry";

export default async function RoomEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/play/room");

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Play with friends</h1>
        <p className="mt-1 text-kc-ink-muted">Create a room and share the code, or join one.</p>
        <div className="mt-8">
          <RoomEntry />
        </div>
      </main>
    </div>
  );
}
