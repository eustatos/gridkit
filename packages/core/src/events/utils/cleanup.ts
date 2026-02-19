export interface CleanupManager {
  track: (id: symbol, cleanup: () => void) => void;
  untrack: (id: symbol) => void;
  cleanup: () => void;
}

/**
 * Create cleanup manager for memory leak prevention
 */
export function createCleanupManager(): CleanupManager {
  const cleanups = new Map<symbol, () => void>();
  const tracked = new Set<symbol>();

  return {
    track(id: symbol, cleanup: () => void): void {
      cleanups.set(id, cleanup);
      tracked.add(id);
    },

    untrack(id: symbol): void {
      tracked.delete(id);
    },

    cleanup(): void {
      // Use iterator explicitly to handle Set iteration
      const iterator = tracked.values();
      let current = iterator.next();
      while (!current.done) {
        const cleanup = cleanups.get(current.value);
        if (cleanup) {
          try {
            cleanup();
          } catch (error) {
            console.error('Error during cleanup:', error);
          }
        }
        current = iterator.next();
      }
      tracked.clear();
      cleanups.clear();
    },
  };
}
