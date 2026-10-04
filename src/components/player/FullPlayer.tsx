"use client";

import {
  ListMusic,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Artwork } from "@/components/ui/Artwork";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { usePlayerStore } from "@/store/player-store";
import { usePlayerUiStore } from "@/store/player-ui-store";

import { LikeCurrentButton } from "./LikeCurrentButton";
import { PlayPauseButton } from "./PlayPauseButton";
import { PlayerProgress } from "./ProgressBar";
import { QueuePanel } from "./QueuePanel";
import { VolumeControl } from "./VolumeControl";

function StatusLine() {
  const status = usePlayerStore((state) => state.status);

  return (
    <p role="status" className="min-h-5 text-center text-xs text-secondary">
      {status === "loading"
        ? "Loading…"
        : status === "buffering"
          ? "Buffering…"
          : ""}
    </p>
  );
}

function ErrorNotice() {
  const message = usePlayerStore((state) => state.error?.message ?? null);
  const status = usePlayerStore((state) => state.status);
  const play = usePlayerStore((state) => state.play);
  const stop = usePlayerStore((state) => state.stop);

  if (message === null) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm"
    >
      <p className="text-danger">{message}</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => void play()}>
          {status === "error" ? "Retry" : "Play"}
        </Button>
        <Button size="sm" variant="ghost" onClick={stop}>
          Stop
        </Button>
      </div>
    </div>
  );
}

function ShuffleButton() {
  const shuffle = usePlayerStore((state) => state.shuffle);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  return (
    <IconButton
      icon={Shuffle}
      label="Shuffle"
      pressed={shuffle}
      onClick={toggleShuffle}
    />
  );
}

function RepeatButton() {
  const repeat = usePlayerStore((state) => state.repeat);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);

  return (
    <IconButton
      icon={repeat === "one" ? Repeat1 : Repeat}
      label={`Repeat: ${repeat}`}
      accent={repeat !== "off"}
      onClick={cycleRepeat}
    />
  );
}

function PlayerView() {
  const track = usePlayerStore((state) => state.currentTrack);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const openQueue = usePlayerUiStore((state) => state.openQueue);

  if (track === null) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-[min(100%,20rem,40dvh)]">
        <Artwork src={track.artworkUrl} alt="" size="fill" className="rounded-lg" />
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">
            {track.title}
          </p>
          <p className="truncate text-sm text-secondary">{track.artist}</p>
        </div>
        <LikeCurrentButton track={track} />
      </div>

      <ErrorNotice />

      <div>
        <PlayerProgress />
        <StatusLine />
      </div>

      <div className="flex items-center justify-between gap-1">
        <ShuffleButton />
        <IconButton icon={SkipBack} filled label="Previous" onClick={previous} />
        <PlayPauseButton size="lg" variant="solid" initialFocus />
        <IconButton icon={SkipForward} filled label="Next" onClick={next} />
        <RepeatButton />
      </div>

      <div className="flex items-center justify-between gap-2">
        <VolumeControl />
        <IconButton icon={ListMusic} label="Open queue" onClick={openQueue} />
      </div>
    </div>
  );
}

function Content() {
  const queueOpen = usePlayerUiStore((state) => state.queueOpen);
  const ref = useRef<HTMLDivElement>(null);

  // Switching views unmounts the focused control; move focus to the new view
  // instead of letting it fall back to the page behind the dialog.
  useEffect(() => {
    ref.current?.focus();
  }, [queueOpen]);

  return (
    <div ref={ref} tabIndex={-1} className="focus:outline-none">
      {queueOpen ? <QueuePanel /> : <PlayerView />}
    </div>
  );
}

/**
 * Full player overlay (a dialog: focus trap, Escape and scroll lock come from
 * Modal). Mounted once in the root layout, so it survives route changes.
 * Escape / close goes queue -> player -> closed. It owns no playback state.
 */
export function FullPlayer() {
  const fullOpen = usePlayerUiStore((state) => state.fullOpen);
  const queueOpen = usePlayerUiStore((state) => state.queueOpen);
  const closeFull = usePlayerUiStore((state) => state.closeFull);
  const closeQueue = usePlayerUiStore((state) => state.closeQueue);
  const hasTrack = usePlayerStore((state) => state.currentTrack !== null);

  // Playback was stopped while the overlay was open.
  useEffect(() => {
    if (fullOpen && !hasTrack) closeFull();
  }, [fullOpen, hasTrack, closeFull]);

  return (
    <Modal
      open={fullOpen && hasTrack}
      size="full"
      title={queueOpen ? "Queue" : "Now playing"}
      onClose={queueOpen ? closeQueue : closeFull}
    >
      <Content />
    </Modal>
  );
}
