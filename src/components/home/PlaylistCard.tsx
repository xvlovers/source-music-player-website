import { ChevronRight, ListMusic } from "lucide-react";
import Link from "next/link";

import { Artwork } from "@/components/ui/Artwork";
import { cn } from "@/lib/utils/cn";
import type { Playlist } from "@/types/library";

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

/** Link to /playlists/[id]. Artwork comes from the playlist's first track, if any. */
export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
  const count = playlist.tracks.length;
  const cover = playlist.tracks.find((track) => track.artworkUrl)?.artworkUrl ?? null;

  return (
    <Link
      href={`/playlists/${encodeURIComponent(playlist.id)}`}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-lg border border-border bg-surface p-2.5 transition-colors hover:bg-surface-elevated",
        className,
      )}
    >
      {cover !== null ? (
        <Artwork src={cover} alt="" size={48} />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-elevated text-muted"
        >
          <ListMusic className="size-5" />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {playlist.name}
        </span>
        <span className="block truncate text-xs text-secondary">
          {count} {count === 1 ? "track" : "tracks"}
        </span>
      </span>

      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted transition-colors group-hover:text-foreground"
      />
      <span className="sr-only">Open playlist</span>
    </Link>
  );
}
