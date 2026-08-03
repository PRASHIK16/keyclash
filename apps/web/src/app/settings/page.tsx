import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { SettingsPanel } from "@/components/settings-panel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirectTo=/settings");

  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Settings</h1>
        <p className="mt-1 text-kc-ink-muted">Saved on this device.</p>
        <div className="mt-8">
          <SettingsPanel />
        </div>
      </main>
    </div>
  );
}
