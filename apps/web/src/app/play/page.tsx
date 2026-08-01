import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardTitle } from "@keyclash/ui";

export default function PlayHubPage() {
  return (
    <div className="min-h-screen bg-kc-bg">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-kc-ink">Choose your match</h1>
        <p className="mt-2 text-kc-ink-muted">Warm up solo, or put your rating on the line.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/play/practice">
            <Card className="h-full transition-colors hover:border-kc-accent">
              <CardContent>
                <CardTitle>Practice</CardTitle>
                <p className="mt-2 text-sm text-kc-ink-muted">
                  Classic and Zen modes. No pressure, no rating risk — just clean reps.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/daily">
            <Card className="h-full transition-colors hover:border-kc-accent">
              <CardContent>
                <CardTitle>Daily Challenge</CardTitle>
                <p className="mt-2 text-sm text-kc-ink-muted">
                  One shot, same text as everyone today. Bonus XP and coins.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="opacity-60">
            <CardContent>
              <CardTitle>Ranked 1v1</CardTitle>
              <p className="mt-2 text-sm text-kc-ink-muted">
                Live matchmaking, real-time races, rating on the line. Shipping in the next
                milestone — the practice and daily loops above are fully live right now.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
