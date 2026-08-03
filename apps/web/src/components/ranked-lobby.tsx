"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Swords } from "lucide-react";

interface LobbyPresenceState {
  userId: string;
  username: string;
  rating: number;
  joinedAt: number;
}

interface MatchCreatedPayload {
  matchId: string;
  playerOneId: string;
  playerTwoId: string;
}

const LOBBY_CHANNEL = "lobby:ranked";

/**
 * WHY THIS DESIGN: a full server-side matchmaking queue (a worker process
 * pulling from a waiting-players table) is the "correct" long-term answer,
 * but it needs a persistent background process — infrastructure this
 * project doesn't have yet, and the previous project's whole set of
 * blockers came from exactly this kind of extra infrastructure. Supabase
 * Realtime Presence lets every connected client see the same shared
 * "who's waiting" list without any server process at all: presence state is
 * synced by Supabase's Realtime service itself. The trade-off is pairing
 * logic has to be deterministic and duplicate-safe since multiple clients
 * observe the same state simultaneously — handled below by having only the
 * lexicographically-smaller user id in a pair trigger match creation.
 */
export function RankedLobby({
  userId,
  username,
  rating,
}: {
  userId: string;
  username: string;
  rating: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"searching" | "matched">("searching");
  const [waitingCount, setWaitingCount] = useState(1);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(LOBBY_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<LobbyPresenceState>();
        const waiting = Object.values(state)
          .flat()
          .sort((a, b) => a.joinedAt - b.joinedAt);

        setWaitingCount(waiting.length);

        if (waiting.length >= 2 && !hasTriggeredRef.current) {
          const [first, second] = waiting;
          if (!first || !second) return;
          const amInPair = first.userId === userId || second.userId === userId;
          if (!amInPair) return;

          const opponent = first.userId === userId ? second : first;
          const iAmResponsible = userId < opponent.userId;

          if (iAmResponsible) {
            hasTriggeredRef.current = true;
            createMatch(opponent.userId);
          }
        }
      })
      .on(
        "broadcast",
        { event: "match_created" },
        ({ payload }: { payload: MatchCreatedPayload }) => {
          if (payload.playerOneId === userId || payload.playerTwoId === userId) {
            setStatus("matched");
            channel.untrack();
            supabase.removeChannel(channel);
            router.push(`/play/ranked/${payload.matchId}`);
          }
        }
      )
      .subscribe(async (subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") {
          await channel.track({
            userId,
            username,
            rating,
            joinedAt: Date.now(),
          } satisfies LobbyPresenceState);
        }
      });

    async function createMatch(opponentId: string) {
      try {
        const res = await fetch("/api/match/ranked/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opponentId }),
        });
        if (!res.ok) {
          hasTriggeredRef.current = false;
          return;
        }
        const data = await res.json();

        // IMPORTANT: Supabase does not deliver a broadcast back to the
        // client that sent it (no `self: true` on this channel), so the
        // player who creates the match would otherwise never receive their
        // own "match_created" event and would be stuck on this screen
        // forever. Navigate directly here for self; broadcast separately so
        // the *opponent's* client (which never called this function) still
        // finds out and navigates too. Order matters: send the broadcast
        // BEFORE tearing down the channel — removeChannel unsubscribes it,
        // so a send() issued afterward would silently never reach anyone.
        setStatus("matched");
        channel.send({
          type: "broadcast",
          event: "match_created",
          payload: { matchId: data.matchId, playerOneId: userId, playerTwoId: opponentId },
        });
        channel.untrack();
        supabase.removeChannel(channel);
        router.push(`/play/ranked/${data.matchId}`);
      } catch {
        hasTriggeredRef.current = false;
      }
    }

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId, username, rating, router]);

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="relative">
        <div className="kc-pulse-glow flex h-24 w-24 items-center justify-center rounded-full border border-kc-violet bg-kc-surface">
          <Swords className="text-kc-violet" size={32} />
        </div>
      </div>
      <div>
        <p className="font-display text-xl font-bold text-kc-ink">
          {status === "searching" ? "Searching for an opponent…" : "Match found!"}
        </p>
        <p className="mt-1 text-sm text-kc-ink-muted">
          {waitingCount > 1
            ? `${waitingCount} players in queue`
            : "You're first in line — hang tight"}
        </p>
      </div>
    </div>
  );
}
