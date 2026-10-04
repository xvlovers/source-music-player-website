"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Music,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LibraryErrorBoundary } from "@/components/library/LibraryErrorBoundary";
import { TrackList } from "@/components/library/TrackList";
import { Button } from "@/components/ui/Button";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useIsClient } from "@/hooks/useIsClient";
import { useLibraryActions, usePlaylist } from "@/hooks/useLibrary";
import { toMusicTrack } from "@/lib/music/snapshot";
import { usePlayerStore } from "@/store/player-store";
import type { LibraryTrackSnapshot } from "@/types/library";

import { AddSongsModal } from "./AddSongsModal";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { DeletePlaylistModal } from "./DeletePlaylistModal";
import { PlaylistNameModal } from "./PlaylistNameModal";

const BACK_LINK_CLASS =
  "inline-flex h-10 items-center justify-center rounded-lg bg-surface-elevated px-4 text-sm font-medium text-foreground transition-colors hover:bg-border";

function DetailBody({ id }: { id: string }) {
  const router = useRouter();
  const playlist = usePlaylist(id);
  const { renamePlaylist, deletePlaylist, removeTrackFromPlaylist, moveTrack } =
    useLibraryActions();
  const playQueue = usePlayerStore((state) => state.playQueue);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addSongsOpen, setAddSongsOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<LibraryTrackSnapshot | null>(null);
  // After a confirmed delete the playlist is gone before navigation finishes;
  // this keeps "not found" from flashing in between.
  const [deleted, setDeleted] = useState(false);

  if (deleted) return <LoadingSkeleton variant="row" count={4} />;

  if (playlist === null) {
    return (
      <EmptyState
        icon={ListMusic}
        title="Playlist tidak ditemukan."
        description="Playlist ini mungkin sudah dihapus."
        action={
          <Link href="/library" className={BACK_LINK_CLASS}>
            Back to Library
          </Link>
        }
      />
    );
  }

  const count = playlist.tracks.length;
  const empty = count === 0;

  const handleRename = (name: string): string | null => {
    if (playlist.name === name) return null;
    return renamePlaylist(playlist.id, name)
      ? null
      : "Could not rename the playlist.";
  };

  const handleDelete = () => {
    setDeleted(true);
    deletePlaylist(playlist.id);
    router.replace("/library");
  };

  const handlePlayAll = () => {
    void playQueue(playlist.tracks.map(toMusicTrack), 0);
  };

  return (
    <div className="min-w-0">
      <Link
        href="/playlists"
        className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Playlists
      </Link>

      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              {playlist.name}
            </h1>
            <p className="mt-1 text-sm text-secondary">
              {count} {count === 1 ? "track" : "tracks"}
            </p>
          </div>
          <ContextMenu
            label="Playlist options"
            items={[
              {
                key: "rename",
                label: "Rename",
                icon: Pencil,
                onSelect: () => setRenameOpen(true),
              },
              {
                key: "delete",
                label: "Delete playlist",
                icon: Trash2,
                tone: "danger",
                onSelect: () => setDeleteOpen(true),
              },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" disabled={empty} onClick={handlePlayAll}>
            <Play aria-hidden="true" className="size-4" fill="currentColor" />
            Play All
          </Button>
          <Button variant="secondary" onClick={() => setAddSongsOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Add songs
          </Button>
        </div>
      </header>

      {empty ? (
        <EmptyState
          icon={Music}
          title="Playlist ini belum memiliki lagu."
          description="Tambahkan lagu dari daftar yang kamu sukai atau baru diputar."
          className="rounded-xl border border-dashed border-border py-10"
        />
      ) : (
        <TrackList
          className="max-w-3xl"
          tracks={playlist.tracks}
          showIndex
          onAddToPlaylist={setAddTarget}
          getMenuItems={(track) => [
            {
              key: "remove-from-playlist",
              label: "Remove from playlist",
              icon: Trash2,
              tone: "danger",
              onSelect: () => removeTrackFromPlaylist(playlist.id, track.id),
            },
          ]}
          renderTrailing={(track, index, total) => (
            <span className="flex shrink-0 items-center">
              <IconButton
                icon={ChevronUp}
                size="sm"
                label={`Move ${track.title} up`}
                disabled={index === 0}
                onClick={() => moveTrack(playlist.id, track.id, "up")}
              />
              <IconButton
                icon={ChevronDown}
                size="sm"
                label={`Move ${track.title} down`}
                disabled={index === total - 1}
                onClick={() => moveTrack(playlist.id, track.id, "down")}
              />
            </span>
          )}
        />
      )}

      <PlaylistNameModal
        open={renameOpen}
        mode="rename"
        initialName={playlist.name}
        onSubmit={handleRename}
        onClose={() => setRenameOpen(false)}
      />
      <DeletePlaylistModal
        open={deleteOpen}
        playlistName={playlist.name}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
      <AddSongsModal
        open={addSongsOpen}
        playlistId={playlist.id}
        onClose={() => setAddSongsOpen(false)}
      />
      <AddToPlaylistModal track={addTarget} onClose={() => setAddTarget(null)} />
    </div>
  );
}

export function PlaylistDetail({ id }: { id: string }) {
  // Wait for hydration: before it the stored playlist is not readable yet,
  // and "not found" would flash for a playlist that does exist.
  const ready = useIsClient();

  if (!ready) return <LoadingSkeleton variant="row" count={5} />;

  return (
    <LibraryErrorBoundary>
      <DetailBody id={id} />
    </LibraryErrorBoundary>
  );
}
