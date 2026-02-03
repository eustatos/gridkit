/**
 * Cleanup manager for memory leak prevention.
 *
 * @module @gridkit/core/events/utils/cleanup
 */

/**
 * Cleanup manager interface.
 *
 * @public
 */
export interface CleanupManager {
  /**
   * Track a cleanup function.
   */
  track: (id: symbol, cleanup: () => void) => void;

  /**
   * Remove cleanup from tracking.
   */
  untrack: (id: symbol) => void;

  /**
   * Execute all cleanup functions.
   */
  cleanup: () => void;
}

/**
 * Create cleanup manager for memory management.
 *
 * @returns Cleanup manager instance
 *
 * @example
 * ```typescript
 * const manager = createCleanupManager();
 * const handlerId = Symbol('handler');
 *
 * manager.track(handlerId, () => {
 *   console.log('Cleaning up handler');
 * });
 *
 * // Later...
 * manager.cleanup(); // Executes all cleanup functions
 * ```
 *
 * @public
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
    },
  };
}

/**
 * Check for potential memory leaks.
 *
 * @param tracked - Set of tracked IDs
 * @param maxAllowed - Maximum allowed tracked items
 * @returns Warning message if leak detected, null otherwise
 *
 * @public
 */
export function checkForMemoryLeak(
  tracked: Set<symbol>,
  maxAllowed: number = 1000
): string | null {
  if (tracked.size > maxAllowed) {
    return `Potential memory leak detected: ${tracked.size} items tracked (max ${maxAllowed})`;
  }
  return null;
}
