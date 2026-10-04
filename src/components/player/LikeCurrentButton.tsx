"use client";

import { Heart } from "lucide-react";

import { IconButton, type IconButtonSize } from "@/components/ui/IconButton";
import { useIsLiked, useLibraryActions } from "@/hooks/useLibrary";
import { toLibraryTrackSnapshot } from "@/lib/music/snapshot";
import type { MusicTrack } from "@/types/music";

interface LikeCurrentButtonProps {
  track: MusicTrack;
  size?: IconButtonSize;
  className?: string;
}

/** Like state comes from the library domain; streamUrl is never persisted. */
export function LikeCurrentButton({
  track,
  size = "md",
  className,
}: LikeCurrentButtonProps) {
  const liked = useIsLiked(track.id);
  const { toggleLiked } = useLibraryActions();

  return (
    <IconButton
      icon={Heart}
      size={size}
      filled={liked}
      accent={liked}
      className={className}
      label={liked ? `Unlike ${track.title}` : `Like ${track.title}`}
      onClick={() => toggleLiked(toLibraryTrackSnapshot(track))}
    />
  );
}
