"use client";

import { Heart, History, ListMusic, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PageSection } from "@/components/layout/PageSection";
import { LibraryErrorBoundary } from "@/components/library/LibraryErrorBoundary";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { TrackCard } from "@/components/ui/TrackCard";
import { TrackRow } from "@/components/ui/TrackRow";
import { useIsClient } from "@/hooks/useIsClient";
import { useLibrary } from "@/hooks/useLibrary";
import { useTrackPlayback } from "@/hooks/useTrackPlayback";
import { toMusicTrack } from "@/lib/music/snapshot";
import type { LibraryTrackSnapshot } from "@/types/library";


const RECENT_LIMIT = 6;
const LIKED_LIMIT = 6;
const PLAYLIST_LIMIT = 6;

/** Search entry only: it links to /search and never runs a search itself. */
function SearchEntry() {
  return (
    <Link
      href="/search"
      className="flex h-11 w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-secondary md:max-w-md"
    >
      <Search aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">Cari lagu, artis, atau album</span>
      <span className="sr-only">Open search</span>
    </Link>
  );
}

function PageSections() {
  const {
    likedTracks,
    recentTracks,
    playlists,
    isLiked,
    toggleLiked,
  } = useLibrary();

  const recent = useMemo(
    () => recentTracks.slice(0, RECENT_LIMIT).map(toMusicTrack),
    [recentTracks],
  );
  const liked = useMemo(
    () => likedTracks.slice(0, LIKED_LIMIT).map(toMusicTrack),
    [likedTracks],
  );
  const shownPlaylists = useMemo(
    () => playlists.slice(0, PLAYLIST_LIMIT),
    [playlists],
  );

  const recentPlayback = useTrackPlayback(recent);
  const likedPlayback = useTrackPlayback(liked);

  const like = (track: LibraryTrackSnapshot) => () => {
    toggleLiked(track);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <PageSection id="recent" title="Recently Played">
        {recent.length === 0 ? (
          <EmptyState
            icon={History}
            title="Belum ada lagu yang diputar."
            description="Lagu yang kamu putar akan muncul di sini."
            className="rounded-xl border border-dashed border-border py-10"
          />
        ) : (
          <ul className="grid gap-x-4 gap-y-0.5 lg:grid-cols-2">
            {recent.map((track, index) => (
              <li key={track.id} className="min-w-0">
                <TrackRow
                  track={track}
                  active={track.id === recentPlayback.currentId}
                  isPlaying={recentPlayback.isPlaying}
                  onPlay={() => recentPlayback.play(index)}
                  isLiked={isLiked(track.id)}
                  onLike={like(track)}
                  showDuration={false}
                />
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <PageSection
        id="liked"
        title="Liked"
        href={likedTracks.length > LIKED_LIMIT ? "/library" : undefined}
      >
        {liked.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Belum ada lagu yang disukai."
            description="Tandai lagu dengan ikon hati untuk menyimpannya di sini."
            className="rounded-xl border border-dashed border-border py-10"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {liked.map((track, index) => (
              <li key={track.id} className="min-w-0">
                <TrackCard
                  track={track}
                  active={track.id === likedPlayback.currentId}
                  isPlaying={likedPlayback.isPlaying}
                  onPlay={() => likedPlayback.play(index)}
                />
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <PageSection
        id="playlists"
        title="Playlists"
        href={playlists.length > PLAYLIST_LIMIT ? "/playlists" : undefined}
      >
        {shownPlaylists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="Belum ada playlist."
            description="Playlist yang kamu buat akan muncul di sini."
            className="rounded-xl border border-dashed border-border py-10"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shownPlaylists.map((playlist) => (
              <li key={playlist.id} className="min-w-0">
                <PlaylistCard playlist={playlist} />
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </div>
  );
}

export function HomeContent() {
  // Library data lives in the browser; until hydration finishes the server
  // snapshot is empty, so show a skeleton instead of flashing empty states.
  const ready = useIsClient();

  return (
    <div className="min-w-0">
      <header className="mb-6 space-y-4 md:mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Home
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Recently played, liked songs and your playlists.
          </p>
        </div>
        <SearchEntry />
      </header>

      {ready ? (
        <LibraryErrorBoundary>
          <PageSections />
        </LibraryErrorBoundary>
      ) : (
        <div className="space-y-8" aria-busy="true">
          <LoadingSkeleton variant="row" count={4} />
          <LoadingSkeleton variant="card" count={4} />
        </div>
      )}
    </div>
  );
}
