"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@keyclash/ui";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // "Remember me" approximation: Supabase's storage adapter (localStorage vs
  // sessionStorage) is fixed when the client is created, not per sign-in, so
  // a true persistent-vs-session-only swap isn't available without recreating
  // the client. This gets a close, low-risk equivalent instead: if the box is
  // unchecked, we sign out automatically when the tab/window closes.
  useEffect(() => {
    if (rememberMe) return;
    function handleUnload() {
      void supabase.auth.signOut();
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rememberMe]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "sign-up") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.push("/play");
      router.refresh();
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/play");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {mode === "sign-up" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-kc-ink-muted">Username</label>
          <input
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-sm text-kc-ink outline-none focus:border-kc-accent"
            placeholder="speedtyper42"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-kc-ink-muted">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-sm text-kc-ink outline-none focus:border-kc-accent"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-kc-ink-muted">Password</label>
          {mode === "sign-in" && (
            <Link href="/forgot-password" className="text-xs text-kc-accent hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <input
          required
          minLength={6}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-sm text-kc-ink outline-none focus:border-kc-accent"
          placeholder="••••••••"
        />
      </div>

      {mode === "sign-in" && (
        <label className="flex items-center gap-2 text-xs text-kc-ink-muted">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-kc-border accent-[var(--kc-accent)]"
          />
          Remember me on this device
        </label>
      )}

      {error && <p className="text-sm text-kc-danger">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
