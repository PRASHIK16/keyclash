import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-kc-bg">
      <div className="kc-grid-bg pointer-events-none absolute inset-0" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="kc-float-up">
          <KeyclashMark />
        </div>

        <h1
          className="kc-gradient-text kc-float-up mt-8 font-display text-6xl font-extrabold tracking-tight sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Keyclash
        </h1>

        <p
          className="kc-float-up mt-4 max-w-lg text-lg text-kc-ink-muted"
          style={{ animationDelay: "160ms" }}
        >
          Ranked typing matches. Daily challenges. A rating that only goes up if you earn it —{" "}
          <span className="text-kc-ink">bas ek aur game</span>.
        </p>

        <div className="kc-float-up mt-10 flex gap-3" style={{ animationDelay: "240ms" }}>
          <Link
            href="/sign-up"
            className="kc-pulse-glow rounded-lg bg-kc-accent px-7 py-3.5 text-sm font-bold text-black transition-transform hover:scale-105"
          >
            Start climbing
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-kc-border bg-kc-surface px-7 py-3.5 text-sm font-medium text-kc-ink transition-colors hover:bg-kc-surface-2"
          >
            Sign in
          </Link>
        </div>

        <div
          className="kc-float-up mt-16 grid grid-cols-3 gap-8 text-left"
          style={{ animationDelay: "320ms" }}
        >
          <Stat label="Ranked matches" value="Live 1v1 races" />
          <Stat label="Every single day" value="Fresh daily challenge" />
          <Stat label="Zero pay-to-win" value="Skill decides rating" />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="max-w-[140px]">
      <p className="font-display text-sm font-bold text-kc-accent">{value}</p>
      <p className="mt-1 text-xs text-kc-ink-muted">{label}</p>
    </div>
  );
}

/** Signature mark: two crossed key-caps mid-clash, echoing the product name. */
function KeyclashMark() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <circle cx="44" cy="44" r="40" fill="url(#kc-glow)" opacity="0.5" />
      <rect
        x="10"
        y="34"
        width="40"
        height="28"
        rx="6"
        fill="#7C3AED"
        transform="rotate(-16 30 48)"
      />
      <rect
        x="38"
        y="34"
        width="40"
        height="28"
        rx="6"
        fill="#C6FF3D"
        transform="rotate(16 58 48)"
      />
      <defs>
        <radialGradient id="kc-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
