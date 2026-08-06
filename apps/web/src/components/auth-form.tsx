"use client";

import { useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // On success, Supabase redirects the whole page to Google — nothing
    // else to do here, the /auth/callback route handles the return trip.
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-kc-border bg-kc-surface-2 px-4 py-2.5 text-sm font-medium text-kc-ink transition-colors hover:bg-kc-surface-3 disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-kc-border" />
        <span className="text-xs text-kc-ink-muted">or</span>
        <div className="h-px flex-1 bg-kc-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && <p className="text-sm text-kc-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.6 5.6C41.5 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
