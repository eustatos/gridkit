/**
 * History utilities for SimpleTimeTravel
 *
 * @packageDocumentation
 * Provides stack-based history management with navigation capabilities.
 */

// Re-export main classes
export { HistoryStack } from "./HistoryStack";
export { HistoryIndex } from "./HistoryIndex";
export { HistoryValidator } from "./HistoryValidator";

// Re-export types
export type {
  StackConfig,
  StackOperation,
  StackEvent,
  StackStats,
  StackSnapshot,
  StackPosition,
  IndexPosition,
  IndexRange,
  ValidationRule,
  ValidationWarning,
  ValidationResult,
  HistoryBounds,
  HistoryDiff,
  HistorySearchCriteria,
  HistorySearchResult,
  HistoryCompactionOptions,
  HistoryExportData,
  HistoryImportResult,
} from "./types";

// Re-export constants
export {
  DEFAULT_MAX_SIZE,
  DEFAULT_VALIDATION_LEVEL,
  VALIDATION_RULES,
  COMPACTION_STRATEGIES,
  SORT_ORDERS,
} from "./constants";

/**
 * Create a new history stack
 * @param maxSize Maximum number of items in stack
 * @returns HistoryStack instance
 */
export function createHistoryStack(maxSize: number = 50): HistoryStack {
  return new HistoryStack(maxSize);
}

/**
 * Create a history index from array
 * @param items Array of items
 * @param currentIndex Current position
 * @returns HistoryIndex instance
 */
export function createHistoryIndex<T>(
  items: T[],
  currentIndex: number = -1,
): HistoryIndex<T> {
  return new HistoryIndex(items, currentIndex);
}

/**
 * Check if a position is valid in history
 * @param index Position to check
 * @param totalLength Total length of history
 * @returns True if position is valid
 */
export function isValidHistoryPosition(
  index: number,
  totalLength: number,
): boolean {
  return index >= 0 && index < totalLength;
}

/**
 * Calculate navigation bounds
 * @param currentIndex Current position
 * @param totalLength Total length
 * @returns Navigation bounds
 */
export function calculateNavigationBounds(
  currentIndex: number,
  totalLength: number,
): HistoryBounds {
  return {
    minIndex: 0,
    maxIndex: totalLength - 1,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < totalLength - 1,
    remainingUndo: currentIndex,
    remainingRedo: totalLength - 1 - currentIndex,
  };
}

/**
 * Format history for display
 * @param items History items
 * @param currentIndex Current position
 * @returns Formatted string
 */
export function formatHistoryForDisplay(
  items: any[],
  currentIndex: number,
): string {
  return items
    .map((item, i) => {
      const marker = i === currentIndex ? "→" : " ";
      const action = item.metadata?.action || "unknown";
      return `${marker} [${i}] ${action} (${new Date(item.metadata?.timestamp).toLocaleTimeString()})`;
    })
    .join("\n");
}
