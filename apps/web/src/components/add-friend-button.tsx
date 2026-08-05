"use client";

import { useState } from "react";
import { Button } from "@keyclash/ui";
import { UserPlus, Check } from "lucide-react";

export function AddFriendButton({ username }: { username: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendRequest() {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send request");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  if (status === "sent") {
    return (
      <Button variant="secondary" disabled>
        <Check size={16} /> Request sent
      </Button>
    );
  }

  return (
    <div>
      <Button variant="secondary" onClick={sendRequest}>
        <UserPlus size={16} /> Add friend
      </Button>
      {status === "error" && <p className="mt-1 text-xs text-kc-danger">{errorMessage}</p>}
    </div>
  );
}
