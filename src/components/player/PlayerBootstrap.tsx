"use client";

import { useEffect } from "react";

import { ensurePlayerEngine } from "@/store/player-store";

/**
 * Single mount point for the global audio engine.
 *
 * The engine is an app-lifetime singleton, so nothing is destroyed on
 * unmount: that keeps Strict Mode's mount/unmount/mount cycle from creating
 * or losing an audio element. ensurePlayerEngine() is idempotent, so no
 * listener is ever added twice.
 */
export function PlayerBootstrap() {
  useEffect(() => {
    ensurePlayerEngine();
  }, []);

  return null;
}
