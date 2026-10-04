"use client";

import { ListMusic, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { Artwork } from "@/components/ui/Artwork";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import { usePlayerStore } from "@/store/player-store";

/**
 * The current queue. Choosing a track calls the existing playQueue action
 * with the same list, so queue logic stays in the store; choosing the
 * current track toggles it. Rendered inside the full player.
 */
export function QueuePanel() {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const toggle = usePlayerStore((state) => state.toggle);

  const currentRef = useRef<HTMLLIElement>(null);

  // Bring the current track into view once, when the panel opens.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={ListMusic}
        title="The queue is empty."
        description="Play a track to start a queue."
      />
    );
  }

  return (
    <div className="min-w-0">
      <p className="mb-3 text-sm text-secondary">
        {queueIndex >= 0 ? `Playing ${queueIndex + 1} of ${queue.length}` : `${queue.length} tracks`}
        {shuffle && " · Shuffle on"}
      </p>

      <ul className="flex flex-col gap-0.5">
        {queue.map((track, index) => {
          const current = index === queueIndex;

          return (
            <li key={`${index}:${track.id}`} ref={current ? currentRef : undefined}>
              <button
                type="button"
                onClick={() => (current ? toggle() : void playQueue(queue, index))}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-elevated/60",
                  current && "bg-surface-elevated/60",
                )}
              >
                <span className="flex w-5 shrink-0 justify-center text-xs tabular-nums text-muted">
                  {current ? (
                    <Volume2 aria-hidden="true" className="size-4 text-accent" />
                  ) : (
                    index + 1
                  )}
                </span>
                <Artwork src={track.artworkUrl} alt="" size={40} />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      current ? "text-accent" : "text-foreground",
                    )}
                  >
                    {track.title}
                  </span>
                  <span className="block truncate text-xs text-secondary">
                    {track.artist}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
