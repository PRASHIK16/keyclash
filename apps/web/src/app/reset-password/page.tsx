"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@keyclash/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("done");
    setTimeout(() => router.push("/play"), 1500);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-kc-bg px-4">
      <h1 className="font-display text-2xl font-bold text-kc-ink">Choose a new password</h1>

      {status === "done" ? (
        <p className="text-sm text-kc-ink-muted">Password updated — taking you to Keyclash…</p>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-sm text-kc-ink outline-none focus:border-kc-accent"
          />
          {status === "error" && <p className="text-sm text-kc-danger">{errorMessage}</p>}
          <Button type="submit" className="w-full">
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}
