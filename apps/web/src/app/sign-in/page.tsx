import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-kc-bg px-4">
      <h1 className="font-display text-2xl font-bold text-kc-ink">Welcome back</h1>
      <AuthForm mode="sign-in" />
      <p className="text-sm text-kc-ink-muted">
        No account yet?{" "}
        <Link href="/sign-up" className="text-kc-accent hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
