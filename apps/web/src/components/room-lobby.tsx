"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, Button, Avatar, Badge } from "@keyclash/ui";
import { Copy, Check } from "lucide-react";

interface ParticipantRow {
  player_id: string;
  is_ready: boolean;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface RoomLobbyProps {
  roomId: string;
  code: string;
  modeKind: string;
  durationSeconds: number | null;
  wordTarget: number | null;
  hostId: string;
  userId: string;
}

export function RoomLobby({
  roomId,
  code,
  modeKind,
  durationSeconds,
  wordTarget,
  hostId,
  userId,
}: RoomLobbyProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [starting, setStarting] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isHost = userId === hostId;
  const me = participants.find((p) => p.player_id === userId);
  const isReady = me?.is_ready ?? false;
  const allReady = participants.length >= 2 && participants.every((p) => p.is_ready);

  useEffect(() => {
    const supabase = createClient();

    async function refetchParticipants() {
      const { data } = await supabase
        .from("room_participants")
        .select("player_id, is_ready, profiles!inner(username, avatar_url)")
        .eq("room_id", roomId);
      if (data) setParticipants(data as unknown as ParticipantRow[]);
    }

    async function checkRoomStatus() {
      const { data } = await supabase
        .from("rooms")
        .select("status, match_id")
        .eq("id", roomId)
        .single();
      if (data?.status === "in_progress" && data.match_id) {
        router.push(`/play/ranked/${data.match_id}`);
      }
    }

    refetchParticipants();

    const channel = supabase
      .channel(`room-lobby:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => refetchParticipants()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as { status: string; match_id: string | null };
          if (updated.status === "in_progress" && updated.match_id) {
            router.push(`/play/ranked/${updated.match_id}`);
          }
        }
      )
      .subscribe();

    // Defensive fallback, not the primary mechanism: on a flaky mobile
    // connection a WebSocket can silently drop without the client noticing
    // for a while. This polls every 4s so the lobby can't get permanently
    // stuck even if a realtime event is missed for any reason — the
    // subscription above is still what makes updates feel instant; this is
    // just a safety net under it.
    const pollInterval = setInterval(() => {
      refetchParticipants();
      checkRoomStatus();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [roomId, router]);

  async function toggleReady() {
    setTogglingReady(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, ready: !isReady }),
      });

      if (res.status === 401) {
        // This is the specific failure mode worth naming explicitly rather
        // than a generic error: the session expired or was cleared (e.g.
        // by another tab), and no amount of retrying this same request
        // will fix it — the person needs to actually sign back in.
        setError("Your session has expired. Please refresh the page and sign in again.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to update ready status" }));
        setError(data.error ?? "Failed to update ready status. Please try again.");
        return;
      }

      // The realtime postgres_changes subscription above will pick up the
      // actual state change and re-render participants — this just clears
      // any stale error now that the request succeeded.
      setError(null);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setTogglingReady(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (res.status === 401) {
        setError("Your session has expired. Please refresh the page and sign in again.");
        setStarting(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      // Navigate directly rather than waiting on the postgres_changes event
      // for the host's own client — same principle as the quick-match fix:
      // don't make your own next step depend on receiving your own update.
      router.push(`/play/ranked/${data.matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setStarting(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-xs text-kc-ink-muted">Room code</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-kc-ink">{code}</p>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 rounded-lg border border-kc-border bg-kc-surface-2 px-3 py-2 text-sm text-kc-ink hover:bg-kc-surface-3"
          >
            {copied ? <Check size={16} className="text-kc-accent" /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-kc-ink-muted">
            {modeKind === "time" ? `Time · ${durationSeconds}s` : `Words · ${wordTarget}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-kc-border p-0">
          {participants.map((p) => (
            <div
              key={p.player_id}
              className={`kc-float-up flex items-center justify-between px-5 py-4 transition-colors duration-300 ${
                p.is_ready ? "bg-kc-accent/5" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={p.is_ready ? "rounded-full ring-2 ring-kc-accent/50" : ""}>
                  <Avatar
                    name={p.profiles?.username ?? "?"}
                    imageUrl={p.profiles?.avatar_url}
                    size={32}
                  />
                </div>
                <span className="text-sm font-medium text-kc-ink">
                  {p.profiles?.username ?? "Unknown"}
                  {p.player_id === hostId && (
                    <span className="ml-2 text-xs text-kc-ink-muted">(host)</span>
                  )}
                </span>
              </div>
              <Badge variant={p.is_ready ? "success" : "default"}>
                {p.is_ready ? "Ready" : "Not ready"}
              </Badge>
            </div>
          ))}
          {participants.length < 2 && (
            <p className="px-5 py-6 text-center text-sm text-kc-ink-muted">
              Waiting for someone to join with the code above…
            </p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-center text-sm text-kc-danger">{error}</p>}

      <div className="flex gap-3">
        <Button
          variant={isReady ? "secondary" : "primary"}
          onClick={toggleReady}
          disabled={togglingReady}
          className="flex-1"
        >
          {togglingReady ? "Updating…" : isReady ? "Not ready" : "Ready up"}
        </Button>
        {isHost && (
          <Button onClick={handleStart} disabled={!allReady || starting} className="flex-1">
            Start race
          </Button>
        )}
      </div>
    </div>
  );
}
