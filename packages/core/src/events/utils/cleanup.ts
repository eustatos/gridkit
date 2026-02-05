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
      for (const id of tracked) {
        const cleanup = cleanups.get(id);
        if (cleanup) {
          try {
            cleanup();
          } catch (error) {
            console.error('Error during cleanup:', error);
          }
        }
      }
      tracked.clear();
      cleanups.clear();
    },
  };
}