/**
 * Core module for SimpleTimeTravel
 * Provides the main implementation and core components
 */

// Re-export main class
export { SimpleTimeTravel } from "./SimpleTimeTravel";

// Re-export types
export type {
  TimeTravelAPI,
  TimeTravelOptions,
  Snapshot,
  SnapshotMetadata,
  SnapshotStateEntry,
} from "../types";

// Re-export core components (for advanced use cases or testing)
export { HistoryManager } from "./HistoryManager";
export { HistoryNavigator } from "./HistoryNavigator";
export type { HistoryManagerConfig } from "./HistoryManager";
export type { NavigationResult } from "./HistoryNavigator";

// Re-export internal types (useful for extensions)
export type {
  HistoryState,
  HistoryOperation,
  HistoryValidationResult,
  HistoryIndex,
  HistoryBounds,
} from "./types";
