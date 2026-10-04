"use client";

import { Heart, History } from "lucide-react";
import { useMemo, useState } from "react";

import { PageSection } from "@/components/layout/PageSection";
import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";
import { PlaylistsManager } from "@/components/playlist/PlaylistsManager";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useIsClient } from "@/hooks/useIsClient";
import { useLikedTracks, useRecentItems } from "@/hooks/useLibrary";
import type { LibraryTrackSnapshot } from "@/types/library";

import { LibraryErrorBoundary } from "./LibraryErrorBoundary";
import { TrackList } from "./TrackList";

function LibrarySections() {
  const likedTracks = useLikedTracks();
  const recentItems = useRecentItems();
  const [addTarget, setAddTarget] = useState<LibraryTrackSnapshot | null>(null);

  // `recentItems` is already ordered most recent first by the repository.
  const recentTracks = useMemo(
    () => recentItems.map((item) => item.track),
    [recentItems],
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <PageSection id="liked" title="Liked Songs">
        {likedTracks.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Belum ada lagu yang disukai."
            description="Tandai lagu dengan ikon hati untuk menyimpannya di sini."
            className="rounded-xl border border-dashed border-border py-10"
          />
        ) : (
          <TrackList
            className="max-w-3xl"
            tracks={likedTracks}
            onAddToPlaylist={setAddTarget}
          />
        )}
      </PageSection>

      <PageSection id="recent" title="Recently Played">
        {recentTracks.length === 0 ? (
          <EmptyState
            icon={History}
            title="Belum ada riwayat pemutaran."
            description="Lagu yang kamu putar akan muncul di sini."
            className="rounded-xl border border-dashed border-border py-10"
          />
        ) : (
          <TrackList
            className="max-w-3xl"
            tracks={recentTracks}
            onAddToPlaylist={setAddTarget}
          />
        )}
      </PageSection>

      <PlaylistsManager />

      <AddToPlaylistModal track={addTarget} onClose={() => setAddTarget(null)} />
    </div>
  );
}

export function LibraryContent() {
  // Library data lives in the browser; show a skeleton until hydration is done
  // so empty states never flash before the stored data is read.
  const ready = useIsClient();

  return (
    <div className="min-w-0">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Library
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Your liked songs, listening history and playlists.
        </p>
      </header>

      {ready ? (
        <LibraryErrorBoundary>
          <LibrarySections />
        </LibraryErrorBoundary>
      ) : (
        <div className="space-y-8" aria-busy="true">
          <LoadingSkeleton variant="row" count={4} />
          <LoadingSkeleton variant="row" count={3} />
        </div>
      )}
    </div>
  );
}
