"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@keyclash/ui";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired — please sign in again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username, display_name: username })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      // Postgres unique_violation on the username column.
      if (updateError.code === "23505") {
        setError("That username is already taken — try another.");
      } else {
        setError(updateError.message);
      }
      return;
    }

    router.push("/play");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-kc-bg px-4">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-kc-ink">Choose your username</h1>
        <p className="mt-1 text-sm text-kc-ink-muted">This is how other players will see you.</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          required
          autoFocus
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers, and underscores only"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="speedtyper42"
          className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-center text-sm text-kc-ink outline-none focus:border-kc-accent"
        />
        {error && <p className="text-center text-sm text-kc-danger">{error}</p>}
        <Button type="submit" disabled={loading || !username.trim()} className="w-full">
          {loading ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
