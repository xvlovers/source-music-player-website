"use client";

import { ListMusic, Plus } from "lucide-react";
import { useState } from "react";

import { PageSection } from "@/components/layout/PageSection";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLibraryActions, usePlaylists } from "@/hooks/useLibrary";
import type { Playlist } from "@/types/library";

import { DeletePlaylistModal } from "./DeletePlaylistModal";
import { PlaylistCard } from "./PlaylistCard";
import { PlaylistNameModal } from "./PlaylistNameModal";

interface PlaylistsManagerProps {
  /** Wraps the list in a titled "Playlists" section (Library) or just shows the toolbar. */
  showHeading?: boolean;
}

/** Playlist grid with create, rename and delete. Used by Library and /playlists. */
export function PlaylistsManager({ showHeading = true }: PlaylistsManagerProps) {
  const playlists = usePlaylists();
  const { createPlaylist, renamePlaylist, deletePlaylist } = useLibraryActions();

  const [createOpen, setCreateOpen] = useState(false);
  // Ids, not objects: the modal always reads the live playlist, never a stale copy.
  const [renameId, setRenameId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const renaming = playlists.find((playlist) => playlist.id === renameId) ?? null;
  const deleting = playlists.find((playlist) => playlist.id === deleteId) ?? null;

  const handleCreate = (name: string): string | null =>
    createPlaylist(name) === null ? "Could not create the playlist." : null;

  const handleRename = (name: string): string | null => {
    if (renaming === null) return "This playlist no longer exists.";
    if (renaming.name === name) return null;
    return renamePlaylist(renaming.id, name) ? null : "Could not rename the playlist.";
  };

  const newButton = (
    <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
      <Plus aria-hidden="true" className="size-4" />
      New Playlist
    </Button>
  );

  const body =
    playlists.length === 0 ? (
      <EmptyState
        icon={ListMusic}
        title="Belum ada playlist."
        description="Buat playlist untuk mengelompokkan lagu favoritmu."
        className="rounded-xl border border-dashed border-border py-10"
      />
    ) : (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist: Playlist) => (
          <li key={playlist.id} className="min-w-0">
            <PlaylistCard
              playlist={playlist}
              onRename={(item) => setRenameId(item.id)}
              onDelete={(item) => setDeleteId(item.id)}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <>
      {showHeading ? (
        <PageSection id="playlists" title="Playlists" action={newButton}>
          {body}
        </PageSection>
      ) : (
        <div>
          <div className="mb-4 flex justify-end">{newButton}</div>
          {body}
        </div>
      )}

      <PlaylistNameModal
        open={createOpen}
        mode="create"
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />
      <PlaylistNameModal
        open={renaming !== null}
        mode="rename"
        initialName={renaming?.name ?? ""}
        onSubmit={handleRename}
        onClose={() => setRenameId(null)}
      />
      <DeletePlaylistModal
        open={deleting !== null}
        playlistName={deleting?.name ?? ""}
        onConfirm={() => {
          if (deleting !== null) deletePlaylist(deleting.id);
          setDeleteId(null);
        }}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}
