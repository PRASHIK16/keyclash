import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-kc-bg px-4">
      <h1 className="font-display text-2xl font-bold text-kc-ink">Create your account</h1>
      <AuthForm mode="sign-up" />
      <p className="text-sm text-kc-ink-muted">
        Already playing?{" "}
        <Link href="/sign-in" className="text-kc-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
