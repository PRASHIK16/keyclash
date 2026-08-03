import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { RankedLobby } from "@/components/ranked-lobby";

export default async function RankedLobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/play/ranked");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, rating")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/play");

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <RankedLobby userId={user.id} username={profile.username} rating={profile.rating} />
      </main>
    </div>
  );
}
