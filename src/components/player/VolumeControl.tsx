"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import type { CSSProperties } from "react";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";
import { usePlayerStore } from "@/store/player-store";

/** Mute button + volume slider. Volume and mute live only in the player store. */
export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setMuted = usePlayerStore((state) => state.setMuted);

  const silent = muted || volume === 0;
  const shown = muted ? 0 : volume;
  const Icon = silent ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <IconButton
        icon={Icon}
        size="sm"
        pressed={muted}
        label="Mute"
        onClick={() => setMuted(!muted)}
      />
      <input
        type="range"
        className="slider w-24 md:w-28"
        aria-label="Volume"
        aria-valuetext={`${Math.round(shown * 100)}%`}
        min={0}
        max={1}
        step={0.05}
        value={shown}
        style={{ "--fill": `${shown * 100}%` } as CSSProperties}
        onChange={(event) => {
          const next = Number(event.target.value);
          setVolume(next);
          if (muted && next > 0) setMuted(false);
        }}
      />
    </div>
  );
}
