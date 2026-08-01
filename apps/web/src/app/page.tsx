import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/play");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-kc-bg px-6 text-center">
      <KeyclashMark />
      <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-kc-ink">
        Keyclash
      </h1>
      <p className="mt-3 max-w-md text-kc-ink-muted">
        Ranked typing matches. Daily challenges. A rating that only goes up if you earn it.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-lg bg-kc-accent px-6 py-3 text-sm font-bold text-black transition-all hover:brightness-110"
        >
          Start climbing
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border border-kc-border bg-kc-surface px-6 py-3 text-sm font-medium text-kc-ink transition-colors hover:bg-kc-surface-2"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}

/** Signature mark: two crossed key-caps, echoing the "clash" in the name. */
function KeyclashMark() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <rect
        x="10"
        y="28"
        width="34"
        height="24"
        rx="5"
        fill="#7C3AED"
        transform="rotate(-18 27 40)"
      />
      <rect
        x="28"
        y="28"
        width="34"
        height="24"
        rx="5"
        fill="#C6FF3D"
        opacity="0.9"
        transform="rotate(18 45 40)"
      />
    </svg>
  );
}
