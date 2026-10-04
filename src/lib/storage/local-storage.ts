import type { StorageAdapter, Unsubscribe } from "./types";

type Listener = () => void;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** window.localStorage can throw (privacy mode, blocked storage). */
function getBrowserStorage(): Storage | null {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * localStorage-backed adapter.
 *
 * - SSR safe: nothing browser-specific runs at import or on the server.
 * - An in-memory cache is the source of truth for reads, so state stays
 *   consistent even when setItem fails (quota, private mode).
 * - One shared `storage` listener is attached on first use and kept for the
 *   lifetime of the page (this adapter is an app-wide singleton). It must not
 *   depend on subscribers: a read or write without any subscriber still fills
 *   the cache, and a cache that nobody invalidates would go stale when another
 *   tab changes the key and then overwrite that tab's data.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  const cache = new Map<string, string | null>();
  const listeners = new Map<string, Set<Listener>>();
  let attached = false;

  function notify(key: string): void {
    const set = listeners.get(key);
    if (!set) return;

    for (const listener of [...set]) listener();
  }

  function handleStorageEvent(event: StorageEvent): void {
    if (event.storageArea !== null && event.storageArea !== getBrowserStorage()) {
      return;
    }

    if (event.key === null) {
      cache.clear();
      for (const key of [...listeners.keys()]) notify(key);
      return;
    }

    cache.delete(event.key);
    notify(event.key);
  }

  function attach(): void {
    if (attached || !isBrowser()) return;
    window.addEventListener("storage", handleStorageEvent);
    attached = true;
  }

  function get(key: string): string | null {
    if (!isBrowser()) return null;

    attach();

    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    let value: string | null = null;

    try {
      value = getBrowserStorage()?.getItem(key) ?? null;
    } catch {
      value = null;
    }

    cache.set(key, value);
    return value;
  }

  function write(key: string, value: string | null): void {
    if (!isBrowser()) return;
    if (get(key) === value) return; // get() also attaches the listener

    cache.set(key, value);

    try {
      const storage = getBrowserStorage();

      if (value === null) storage?.removeItem(key);
      else storage?.setItem(key, value);
    } catch {
      // Quota or security error: keep the in-memory value, do not crash the UI.
    }

    notify(key);
  }

  function subscribe(key: string, listener: Listener): Unsubscribe {
    let set = listeners.get(key);

    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }

    set.add(listener);
    attach();

    return () => {
      const current = listeners.get(key);
      if (!current) return;

      current.delete(listener);
      if (current.size === 0) listeners.delete(key);
    };
  }

  return {
    get,
    set: (key, value) => write(key, value),
    remove: (key) => write(key, null),
    subscribe,
  };
}
