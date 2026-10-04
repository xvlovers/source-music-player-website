"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Artwork } from "@/components/ui/Artwork";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  useLibraryActions,
  useLikedTracks,
  usePlaylist,
  useRecentItems,
} from "@/hooks/useLibrary";
import type { LibraryTrackSnapshot } from "@/types/library";

interface AddSongsModalProps {
  open: boolean;
  playlistId: string;
  onClose: () => void;
}

function Candidates({ playlistId }: { playlistId: string }) {
  const playlist = usePlaylist(playlistId);
  const liked = useLikedTracks();
  const recent = useRecentItems();
  const { addTrackToPlaylist } = useLibraryActions();

  // Liked songs first, then history; never a track already in the playlist.
  const candidates = useMemo(() => {
    const present = new Set(playlist?.tracks.map((track) => track.id));
    const seen = new Set<string>();
    const result: LibraryTrackSnapshot[] = [];

    for (const track of [...liked, ...recent.map((item) => item.track)]) {
      if (present.has(track.id) || seen.has(track.id)) continue;
      seen.add(track.id);
      result.push(track);
    }

    return result;
  }, [playlist, liked, recent]);

  if (candidates.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-secondary">
        Belum ada lagu untuk ditambahkan. Suka atau putar lagu lebih dulu, atau{" "}
        <Link href="/search" className="text-foreground underline">
          cari musik
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="-mx-2 flex flex-col gap-0.5">
      {candidates.map((track) => (
        <li key={track.id} className="flex min-w-0 items-center gap-3 px-2 py-1.5">
          <Artwork src={track.artworkUrl} alt="" size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {track.title}
            </span>
            <span className="block truncate text-xs text-secondary">
              {track.artist}
            </span>
          </span>
          <Button
            size="sm"
            aria-label={`Add ${track.title} to playlist`}
            onClick={() => addTrackToPlaylist(playlistId, track)}
          >
            Add
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Add-songs picker for the playlist detail page, fed by liked songs and history. */
export function AddSongsModal({ open, playlistId, onClose }: AddSongsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add songs"
      description="From your liked songs and recently played."
      footer={
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      }
    >
      <Candidates playlistId={playlistId} />
    </Modal>
  );
}
