import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Swords, Trophy, Zap } from "lucide-react";

export default function PlayHubPage() {
  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="font-display text-3xl font-extrabold text-kc-ink">Choose your match</h1>
        <p className="mt-2 text-kc-ink-muted">Warm up solo, or put your rating on the line.</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <ModeCard
            href="/play/practice"
            icon={<Zap className="text-kc-accent" size={22} />}
            title="Practice"
            description="Classic and Zen modes. No pressure, no rating risk — just clean reps."
            accent="accent"
          />
          <ModeCard
            href="/daily"
            icon={<Trophy className="text-kc-violet" size={22} />}
            title="Daily Challenge"
            description="One shot, same text as everyone today. Bonus XP and coins."
            accent="violet"
          />
          <ModeCard
            href="/play/ranked"
            icon={<Swords className="text-kc-danger" size={22} />}
            title="Ranked 1v1"
            description="Live matchmaking. Real-time races. Rating on the line."
            accent="danger"
            fullWidth
          />
        </div>
      </main>
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  description,
  accent,
  fullWidth = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "accent" | "violet" | "danger";
  fullWidth?: boolean;
}) {
  const glowMap: Record<typeof accent, string> = {
    accent: "hover:shadow-[0_0_0_1px_var(--kc-accent),0_0_24px_-4px_var(--kc-accent)]",
    violet: "hover:shadow-[0_0_0_1px_var(--kc-violet),0_0_24px_-4px_var(--kc-violet)]",
    danger: "hover:shadow-[0_0_0_1px_var(--kc-danger),0_0_24px_-4px_var(--kc-danger)]",
  };
  const glow = glowMap[accent];
  return (
    <Link
      href={href}
      className={`group rounded-xl border border-kc-border bg-kc-surface p-6 transition-all duration-200 hover:-translate-y-0.5 ${glow} ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      {icon}
      <p className="mt-3 font-display text-lg font-bold text-kc-ink">{title}</p>
      <p className="mt-1 text-sm text-kc-ink-muted">{description}</p>
    </Link>
  );
}
