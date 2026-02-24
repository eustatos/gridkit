/**
 * SimpleTimeTravel - Main time travel implementation
 *
 * @packageDocumentation
 * Provides undo/redo and time travel capabilities for state management.
 */

import type {
  TimeTravelOptions,
  Snapshot,
  TimeTravelAPI,
} from "../types";

import { HistoryManager } from "./HistoryManager";
import { HistoryNavigator } from "./HistoryNavigator";
import type { HistoryManagerConfig } from "./types";

import { SnapshotCreator } from "../snapshot/SnapshotCreator";
import { SnapshotRestorer } from "../snapshot/SnapshotRestorer";
import type {
  SnapshotCreatorConfig,
  SnapshotRestorerConfig,
} from "../snapshot/types";

import { AtomTracker } from "../tracking/AtomTracker";
import type { TrackerConfig, TrackingEvent } from "../tracking/types";

import { atomRegistry } from "../../atom-registry";
import { Atom, Store } from "../../types";

/**
 * Main SimpleTimeTravel class
 * Provides time travel debugging capabilities for Nexus State
 */
export class SimpleTimeTravel implements TimeTravelAPI {
  private historyManager: HistoryManager;
  private historyNavigator: HistoryNavigator;
  private snapshotCreator: SnapshotCreator;
  private snapshotRestorer: SnapshotRestorer;
  private atomTracker: AtomTracker;
  private isTimeTraveling: boolean = false;
  private autoCapture: boolean;
  private store: Store;
  private originalSet: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  /**
   * Create a new SimpleTimeTravel instance
   * @param store - The store to track
   * @param options - Configuration options
   */
  constructor(store: Store, options: TimeTravelOptions = {}) {
    this.store = store;
    this.autoCapture = options.autoCapture ?? true;
    this.originalSet = store.set.bind(store);

    // Initialize components
    this.atomTracker = new AtomTracker(store, {
      autoTrack: true,
      maxAtoms: options.maxHistory || 50,
      trackComputed: true,
      trackWritable: true,
      trackPrimitive: true,
      ...options.trackingConfig,
    } as TrackerConfig);

    this.snapshotCreator = new SnapshotCreator(store, {
      includeTypes: ["primitive", "computed", "writable"],
      excludeAtoms: options.excludeAtoms || [],
      validate: true,
      generateId: () => Math.random().toString(36).substring(2, 9),
      autoCapture: options.autoCapture ?? true,
      skipStateCheck: true, // Skip state check for initial capture
      ...options.snapshotConfig,
    } as SnapshotCreatorConfig);

    this.snapshotRestorer = new SnapshotRestorer(store, {
      validateBeforeRestore: true,
      strictMode: false,
      onAtomNotFound: "warn",
      batchRestore: true,
      ...options.restoreConfig,
    } as SnapshotRestorerConfig);

    this.historyManager = new HistoryManager(options.maxHistory || 50);

    this.historyNavigator = new HistoryNavigator(
      this.historyManager,
      this.snapshotRestorer,
    );

    // Attach store to registry
    atomRegistry.attachStore(store, options.registryMode || "global");

    // Register initial atoms if provided
    if (options.atoms && Array.isArray(options.atoms)) {
      options.atoms.forEach((atom) => {
        this.atomTracker.track(atom);
        atomRegistry.register(atom, atom.name);
      });
    }

    // Wrap store.set
    store.set = this.wrappedSet.bind(this);

    // Always capture initial state (to have something to undo to)
    // The autoCapture setting will control subsequent auto-captures
    this.capture("initial");
  }

  /**
   * Capture current state as a snapshot
   * @param action - Optional action name for the snapshot
   * @returns The created snapshot or undefined if capture failed
   */
  capture(action?: string): Snapshot | undefined {
    if (this.isTimeTraveling) {
      return undefined;
    }

    console.log(`[TIME_TRAVEL.capture] action: ${action}`);
    const snapshot = this.snapshotCreator.create(
      action,
      new Set(this.atomTracker.getTrackedAtoms().map((atom) => atom.id)),
    );
    console.log(`[TIME_TRAVEL.capture] snapshot created: ${snapshot ? 'yes' : 'no'}`);
    if (snapshot) {
      console.log(`[TIME_TRAVEL.capture] snapshot state:`, Object.entries(snapshot.state).map(([k, v]) => ({ [k]: v.value })));
      this.historyManager.add(snapshot);
    }

    return snapshot || undefined;
  }

  /**
   * Capture current state with result metadata
   * @param action - Optional action name
   * @returns Creation result with metadata
   */
  captureWithResult(action?: string) {
    if (this.isTimeTraveling) {
      return {
        success: false,
        snapshot: null,
        error: "Cannot capture during time travel",
      };
    }

    const result = this.snapshotCreator.createWithResult(
      action,
      new Set(this.atomTracker.getTrackedAtoms().map((atom) => atom.id)),
    );

    if (result.success && result.snapshot) {
      this.historyManager.add(result.snapshot);
    }

    return result;
  }

  /**
   * Undo to previous snapshot
   * @returns True if undo was successful
   */
  undo(): boolean {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      return this.historyNavigator.undo();
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Redo to next snapshot
   * @returns True if redo was successful
   */
  redo(): boolean {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      return this.historyNavigator.redo();
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  /**
   * Jump to a specific snapshot by index
   * @param index - Index in the history array (0-based)
   * @returns True if jump was successful
   */
  jumpTo(index: number): boolean {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      return this.historyNavigator.jumpTo(index);
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.historyManager.clear();

    // Note: clearHistory only clears history, it does not create a new initial snapshot
    // If you need to create a new initial snapshot, call capture("initial") explicitly
  }

  /**
   * Capture current state without checking tracked atoms (for initial/clear capture)
   */
  private captureAllState(action?: string): Snapshot | undefined {
    if (this.isTimeTraveling) {
      return undefined;
    }

    const snapshot = this.snapshotCreator.create(action);
    
    if (snapshot) {
      this.historyManager.add(snapshot);
    }

    return snapshot || undefined;
  }

  /**
   * Get complete history as an array of snapshots
   */
  getHistory(): Snapshot[] {
    return this.historyManager.getAll();
  }

  /**
   * Get history statistics
   */
  getHistoryStats() {
    return this.historyManager.getStats();
  }

  /**
   * Import external state
   * @param state - State to import
   * @returns True if import was successful
   */
  importState(state: Record<string, unknown>): boolean {
    this.isTimeTraveling = true;

    try {
      // Track atoms from imported state
      Object.entries(state).forEach(([key, value]) => {
        const atom = atomRegistry.getByName(key);
        if (atom) {
          this.originalSet(atom, value);
          this.atomTracker.track(atom, key);
        }
      });

      if (this.autoCapture) {
        this.capture("imported");
      }

      return true;
    } catch (error) {
      console.error("Failed to import state:", error);
      return false;
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Get current state as a snapshot (without storing in history)
   */
  getCurrentSnapshot(): Snapshot | null {
    return this.snapshotCreator.create(
      "current",
      new Set(this.atomTracker.getTrackedAtoms().map((atom) => atom.id)),
    );
  }

  /**
   * Compare two snapshots
   * @param a - First snapshot
   * @param b - Second snapshot
   * @returns Diff between snapshots
   */
  compareSnapshots(a: Snapshot, b: Snapshot) {
    // compare not implemented in SnapshotCreator
    return undefined;
  }

  /**
   * Subscribe to history changes
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: any) => void): () => void {
    return this.historyManager.subscribe(listener);
  }

  /**
   * Subscribe to snapshot events
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribeToSnapshots(listener: (snapshot: Snapshot) => void): () => void {
    return this.snapshotCreator.subscribe(listener);
  }

  /**
   * Subscribe to tracking events
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribeToTracking(listener: (event: TrackingEvent) => void): () => void {
    return this.atomTracker.subscribe(listener);
  }

  /**
   * Get atom tracker instance
   */
  getAtomTracker(): AtomTracker {
    return this.atomTracker;
  }

  /**
   * Get history manager instance
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Get snapshot creator instance
   */
  getSnapshotCreator(): SnapshotCreator {
    return this.snapshotCreator;
  }

  /**
   * Get snapshot restorer instance
   */
  getSnapshotRestorer(): SnapshotRestorer {
    return this.snapshotRestorer;
  }

  /**
   * Wrapped set method for auto-capture
   */
  private wrappedSet<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ): void {
    console.log(`[WRAPPED_SET] Called with atom: ${atom.name}, value: ${update}, isTimeTraveling: ${this.isTimeTraveling}`);
    console.log(`[WRAPPED_SET] atom.id: ${atom.id?.toString()}, isTracked: ${this.atomTracker.isTracked(atom)}`);
    
    // Track atom if not already tracked
    if (!this.atomTracker.isTracked(atom)) {
      console.log(`[WRAPPED_SET] Tracking new atom: ${atom.name}`);
      this.atomTracker.track(atom);
      atomRegistry.register(atom, atom.name);
    } else {
      console.log(`[WRAPPED_SET] Atom already tracked`);
    }

    // Get old value for change tracking
    let oldValue: Value | undefined;
    try {
      oldValue = this.store.get(atom);
      console.log(`[WRAPPED_SET] Old value: ${oldValue}`);
    } catch {
      // Ignore if can't get old value
    }

    // Call original set
    console.log(`[WRAPPED_SET] Calling originalSet`);
    this.originalSet(atom, update);
    console.log(`[WRAPPED_SET] originalSet complete`);

    // Get new value
    let newValue: Value | undefined;
    try {
      newValue = this.store.get(atom);
      console.log(`[WRAPPED_SET] New value: ${newValue}`);
    } catch {
      // Ignore if can't get new value
    }

    // Record change
    if (oldValue !== undefined && newValue !== undefined) {
      this.atomTracker.recordChange(atom, oldValue, newValue);
    }

    // Auto-capture if enabled and not during time travel
    if (this.autoCapture && !this.isTimeTraveling) {
      console.log(`[WRAPPED_SET] Auto-capturing`);
      this.capture(`set ${atom.name || atom.id?.description || "atom"}`);
    }
  }

  /**
   * Pause auto-capture
   */
  pauseAutoCapture(): void {
    this.autoCapture = false;
  }

  /**
   * Resume auto-capture
   */
  resumeAutoCapture(): void {
    this.autoCapture = true;
  }

  /**
   * Check if time travel is in progress
   */
  isTraveling(): boolean {
    return this.isTimeTraveling;
  }

  /**
   * Get version
   */
  getVersion(): string {
    return "1.0.0";
  }

  /**
   * Dispose time travel instance
   */
  dispose(): void {
    // Restore original store.set
    this.store.set = this.originalSet;

    // Clear all listeners and history
    // Clear not implemented in HistoryManager
    this.atomTracker.clear();

    // @ts-expect-error - Clean up references
    this.store = null;
  }
}

// Extend TimeTravelOptions to include component-specific configs
declare module "../types" {
  interface TimeTravelOptions {
    /** Atoms to exclude from tracking */
    excludeAtoms?: string[];
    /** Tracking configuration */
    trackingConfig?: Partial<TrackerConfig>;
    /** Snapshot creator configuration */
    snapshotConfig?: Partial<SnapshotCreatorConfig>;
    /** Snapshot restorer configuration */
    restoreConfig?: Partial<SnapshotRestorerConfig>;
    /** History manager configuration */
    historyConfig?: HistoryManagerConfig;
  }
}
