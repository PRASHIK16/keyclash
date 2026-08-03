import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PracticeSession } from "@/components/practice-session";

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/play/practice");

  const { data: profile } = await supabase
    .from("profiles")
    .select("caret_color")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Practice</h1>
        <p className="mt-1 text-kc-ink-muted">No rating risk. Pick a mode and go.</p>
        <div className="mt-8">
          <PracticeSession caretColor={profile?.caret_color ?? "#C6FF3D"} />
        </div>
      </main>
    </div>
  );
}
