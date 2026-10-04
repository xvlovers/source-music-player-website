"use client";

import { ChevronRight, ListMusic, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Artwork } from "@/components/ui/Artwork";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { cn } from "@/lib/utils/cn";
import type { Playlist } from "@/types/library";

interface PlaylistCardProps {
  playlist: Playlist;
  /** With either callback the card gets a "more" menu; without them it is a plain link. */
  onRename?: (playlist: Playlist) => void;
  onDelete?: (playlist: Playlist) => void;
  className?: string;
}

function formatDate(timestamp: number): string | null {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      timestamp,
    );
  } catch {
    return null;
  }
}

/** Link to /playlists/[id]. Artwork comes from the playlist's first track that has one. */
export function PlaylistCard({
  playlist,
  onRename,
  onDelete,
  className,
}: PlaylistCardProps) {
  const count = playlist.tracks.length;
  const cover =
    playlist.tracks.find((track) => track.artworkUrl)?.artworkUrl ?? null;
  const updated = formatDate(playlist.updatedAt);

  const items: ContextMenuItem[] = [];

  if (onRename) {
    items.push({
      key: "rename",
      label: "Rename",
      icon: Pencil,
      onSelect: () => onRename(playlist),
    });
  }

  if (onDelete) {
    items.push({
      key: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "danger",
      onSelect: () => onDelete(playlist),
    });
  }

  const hasMenu = items.length > 0;

  return (
    <div
      className={cn(
        "group relative min-w-0 rounded-lg border border-border bg-surface transition-colors hover:bg-surface-elevated",
        className,
      )}
    >
      <Link
        href={`/playlists/${encodeURIComponent(playlist.id)}`}
        className={cn(
          "flex min-w-0 items-center gap-3 rounded-lg p-2.5",
          hasMenu && "pr-12",
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
            {updated !== null && ` · Updated ${updated}`}
          </span>
        </span>

        {!hasMenu && (
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted transition-colors group-hover:text-foreground"
          />
        )}
        <span className="sr-only">Open playlist</span>
      </Link>

      {hasMenu && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2">
          <ContextMenu
            label={`More options for ${playlist.name}`}
            size="sm"
            items={items}
          />
        </span>
      )}
    </div>
  );
}
