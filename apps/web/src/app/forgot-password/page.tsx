"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@keyclash/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-kc-bg px-4">
      <h1 className="font-display text-2xl font-bold text-kc-ink">Reset your password</h1>

      {status === "sent" ? (
        <p className="max-w-sm text-center text-sm text-kc-ink-muted">
          If an account exists for <span className="text-kc-ink">{email}</span>, a reset link is on
          its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-sm text-kc-ink outline-none focus:border-kc-accent"
          />
          {status === "error" && <p className="text-sm text-kc-danger">{errorMessage}</p>}
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <Link href="/sign-in" className="text-sm text-kc-ink-muted hover:text-kc-ink">
        Back to sign in
      </Link>
    </div>
  );
}
