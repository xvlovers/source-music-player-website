"use client";

import { Check, Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLibraryActions, usePlaylists } from "@/hooks/useLibrary";
import {
  PLAYLIST_NAME_MAX_LENGTH,
  validatePlaylistName,
} from "@/lib/utils/playlist-name";
import type { LibraryTrackSnapshot } from "@/types/library";

interface AddToPlaylistModalProps {
  /** The track to add. The modal is open while this is not null. */
  track: LibraryTrackSnapshot | null;
  onClose: () => void;
}

const FAILED = "Could not add the track. Try again.";

function Body({ track }: { track: LibraryTrackSnapshot }) {
  const playlists = usePlaylists();
  const { addTrackToPlaylist, createPlaylist } = useLibraryActions();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const add = (playlistId: string) => {
    setError(addTrackToPlaylist(playlistId, track) ? null : FAILED);
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalid = validatePlaylistName(newName);
    if (invalid !== null) {
      setError(invalid);
      return;
    }

    const playlist = createPlaylist(newName);
    if (playlist === null || !addTrackToPlaylist(playlist.id, track)) {
      setError(FAILED);
      return;
    }

    setNewName("");
    setError(null);
  };

  return (
    <div>
      {playlists.length > 0 && (
        <ul className="-mx-2 flex flex-col gap-0.5">
          {playlists.map((playlist) => {
            const contained = playlist.tracks.some(
              (item) => item.id === track.id,
            );
            const count = playlist.tracks.length;

            return (
              <li key={playlist.id}>
                <button
                  type="button"
                  disabled={contained}
                  onClick={() => add(playlist.id)}
                  className="flex h-12 w-full min-w-0 items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-surface-elevated disabled:pointer-events-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {playlist.name}
                    </span>
                    <span className="block truncate text-xs text-secondary">
                      {count} {count === 1 ? "track" : "tracks"}
                    </span>
                  </span>
                  {contained ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
                      <Check aria-hidden="true" className="size-4" />
                      Added
                    </span>
                  ) : (
                    <>
                      <Plus
                        aria-hidden="true"
                        className="size-4 shrink-0 text-secondary"
                      />
                      <span className="sr-only">Add to {playlist.name}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={handleCreate}
        noValidate
        className={playlists.length > 0 ? "mt-4 border-t border-border pt-4" : ""}
      >
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {playlists.length > 0 ? "Or create a new playlist" : "Create a playlist"}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={inputId}
            data-autofocus={playlists.length === 0 ? true : undefined}
            type="text"
            value={newName}
            maxLength={PLAYLIST_NAME_MAX_LENGTH}
            autoComplete="off"
            placeholder="Playlist name"
            aria-invalid={error !== null}
            aria-describedby={error !== null ? errorId : undefined}
            onChange={(event) => {
              setNewName(event.target.value);
              setError(null);
            }}
            className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted focus:border-secondary md:text-sm"
          />
          <Button type="submit" className="shrink-0">
            Create
          </Button>
        </div>
        {error !== null && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

/**
 * Lets the user put one track into a playlist. The caller supplies the track;
 * this component only talks to the library domain (no provider, no fetch).
 * Duplicates are prevented by the repository and shown as "Added".
 */
export function AddToPlaylistModal({ track, onClose }: AddToPlaylistModalProps) {
  return (
    <Modal
      open={track !== null}
      onClose={onClose}
      title="Add to playlist"
      description={track ? `${track.title} · ${track.artist}` : undefined}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      }
    >
      {track !== null && <Body track={track} />}
    </Modal>
  );
}
