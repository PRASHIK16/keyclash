"use client";

import { LogOut } from "lucide-react";
import { signOutEverywhere } from "@/lib/sign-out";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOutEverywhere()}
      title="Sign out"
      className="rounded-md p-2 text-kc-ink-muted transition-colors hover:bg-kc-surface-2 hover:text-kc-danger"
    >
      <LogOut size={16} />
    </button>
  );
}
