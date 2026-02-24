/**
 * SnapshotRestorer - Restores state from snapshots
 */

import { Atom, Store } from "../../types";
import type { Snapshot, SnapshotStateEntry } from "../types";
import type { SnapshotRestorerConfig, RestorationResult } from "./types";
import { atomRegistry } from "../../atom-registry";

export class SnapshotRestorer {
  private store: Store;
  private config: SnapshotRestorerConfig;
  private listeners: Set<(snapshot: Snapshot) => void> = new Set();
  private restoreInProgress: boolean = false;

  constructor(store: Store, config?: Partial<SnapshotRestorerConfig>) {
    this.store = store;
    this.config = {
      validateBeforeRestore: true,
      strictMode: false,
      onAtomNotFound: "skip",
      transform: null,
      batchRestore: true,
      ...config,
    };
  }

  /**
   * Restore from snapshot
   * @param snapshot Snapshot to restore
   * @returns True if restoration was successful
   */
  restore(snapshot: Snapshot): boolean {
    if (this.restoreInProgress) {
      throw new Error("Restore already in progress");
    }

    this.restoreInProgress = true;

    try {
      // Validate if configured
      if (
        this.config.validateBeforeRestore &&
        !this.validateSnapshot(snapshot)
      ) {
        return false;
      }

      // Apply transforms
      const snapshotToRestore = this.config.transform
        ? this.config.transform(snapshot)
        : snapshot;

      // Restore state
      if (this.config.batchRestore) {
        this.restoreBatch(snapshotToRestore.state);
      } else {
        this.restoreSequential(snapshotToRestore.state);
      }

      this.emit("restore", snapshotToRestore);
      return true;
    } catch (error) {
      console.error("Failed to restore snapshot:", error);
      return false;
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Restore with result info
   * @param snapshot Snapshot to restore
   * @returns Restoration result with metadata
   */
  restoreWithResult(snapshot: Snapshot): RestorationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let restoredCount = 0;

    if (this.restoreInProgress) {
      return {
        success: false,
        restoredCount: 0,
        errors: ["Restore already in progress"],
        warnings: [],
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    }

    this.restoreInProgress = true;

    try {
      // Validate
      if (this.config.validateBeforeRestore) {
        const validation = this.validateSnapshotWithDetails(snapshot);
        if (!validation.valid) {
          errors.push(...validation.errors);
          if (this.config.strictMode) {
            return {
              success: false,
              restoredCount: 0,
              errors,
              warnings: validation.warnings,
              duration: Date.now() - startTime,
              timestamp: startTime,
            };
          }
          warnings.push(...validation.warnings);
        }
      }

      // Restore each atom
      Object.entries(snapshot.state).forEach(([key, entry]) => {
        try {
          const success = this.restoreAtom(key, entry);
          if (success) restoredCount++;
        } catch (error) {
          errors.push(`Failed to restore atom ${key}: ${error}`);
        }
      });

      const success = errors.length === 0 || !this.config.strictMode;

      if (success) {
        this.emit("restore", snapshot);
      }

      return {
        success,
        restoredCount,
        errors,
        warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    } catch (error) {
      return {
        success: false,
        restoredCount,
        errors: [
          ...errors,
          error instanceof Error ? error.message : String(error),
        ],
        warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Restore multiple snapshots in sequence
   * @param snapshots Snapshots to restore
   * @returns Array of restoration results
   */
  restoreSequence(snapshots: Snapshot[]): RestorationResult[] {
    return snapshots.map((snapshot) => this.restoreWithResult(snapshot));
  }

  /**
   * Restore a single atom
   * @param key Atom key
   * @param entry Snapshot state entry
   * @returns True if restored successfully
   */
  private restoreAtom(key: string, entry: SnapshotStateEntry): boolean {
    // Try to find atom by ID first
    let atom = entry.atomId ? this.findAtomById(entry.atomId) : null;

    // Then try by name
    if (!atom) {
      atom = this.findAtomByName(entry.name || key);
    }

    if (!atom) {
      if (this.config.onAtomNotFound === "throw") {
        throw new Error(`Atom not found: ${key}`);
      }
      if (this.config.onAtomNotFound === "warn") {
        console.warn(`Atom not found: ${key}`);
      }
      return false;
    }

    // Deserialize value if needed
    const value = this.deserializeValue(entry.value, entry.type);

    // Set the value
    this.store.set(atom, value);
    return true;
  }

  /**
   * Restore in batch mode
   * @param state State object
   */
  private restoreBatch(state: Record<string, SnapshotStateEntry>): void {
    // Batch restoration can be optimized by store
    Object.entries(state).forEach(([key, entry]) => {
      this.restoreAtom(key, entry);
    });
  }

  /**
   * Restore sequentially
   * @param state State object
   */
  private restoreSequential(state: Record<string, SnapshotStateEntry>): void {
    // Sequential restoration for dependencies
    const entries = Object.entries(state);

    // First pass: restore primitives
    entries.forEach(([key, entry]) => {
      if (entry.type === "primitive") {
        this.restoreAtom(key, entry);
      }
    });

    // Second pass: restore computed/writable
    entries.forEach(([key, entry]) => {
      if (entry.type !== "primitive") {
        this.restoreAtom(key, entry);
      }
    });
  }

  /**
   * Find atom by ID
   * @param atomId Atom ID string
   * @returns Atom or undefined
   */
  private findAtomById(atomId: string): Atom<unknown> | null {
    const id = Symbol(atomId);
    return atomRegistry.get(id) as Atom<unknown> | null;
  }

  /**
   * Find atom by name
   * @param name Atom name
   * @returns Atom or undefined
   */
  private findAtomByName(name: string): Atom<unknown> | null {
    return atomRegistry.getByName(name) as Atom<unknown> | null;
  }

  /**
   * Deserialize value
   * @param value Serialized value
   * @param type Atom type
   * @returns Deserialized value
   */
  private deserializeValue(value: unknown, type: string): unknown {
    // Handle special cases based on type
    if (type === "date" && typeof value === "string") {
      return new Date(value);
    }
    if (type === "regexp" && typeof value === "string") {
      return new RegExp(value);
    }
    if (type === "map" && Array.isArray(value)) {
      return new Map(value);
    }
    if (type === "set" && Array.isArray(value)) {
      return new Set(value);
    }
    return value;
  }

  /**
   * Validate snapshot
   * @param snapshot Snapshot to validate
   * @returns True if valid
   */
  private validateSnapshot(snapshot: Snapshot): boolean {
    return !!(
      snapshot &&
      snapshot.id &&
      snapshot.state &&
      typeof snapshot.state === "object" &&
      snapshot.metadata &&
      typeof snapshot.metadata.timestamp === "number"
    );
  }

  /**
   * Validate snapshot with details
   * @param snapshot Snapshot to validate
   * @returns Validation details
   */
  private validateSnapshotWithDetails(snapshot: Snapshot): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!snapshot) {
      errors.push("Snapshot is null or undefined");
      return { valid: false, errors, warnings };
    }

    if (!snapshot.id) {
      errors.push("Snapshot missing ID");
    }

    if (!snapshot.state || typeof snapshot.state !== "object") {
      errors.push("Snapshot state is invalid");
    }

    if (!snapshot.metadata) {
      errors.push("Snapshot missing metadata");
    } else {
      if (typeof snapshot.metadata.timestamp !== "number") {
        errors.push("Snapshot timestamp is invalid");
      }
    }

    // Check atom entries
    if (snapshot.state) {
      Object.entries(snapshot.state).forEach(([key, entry]) => {
        if (!entry.value && entry.value !== 0 && entry.value !== false) {
          warnings.push(`Atom ${key} has no value`);
        }
        if (!entry.type) {
          warnings.push(`Atom ${key} missing type`);
        }
        if (!entry.name) {
          warnings.push(`Atom ${key} missing name`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Subscribe to restoration events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event
   * @param event Event type
   * @param snapshot Snapshot
   */
  private emit(event: "restore" | "error", snapshot?: Snapshot): void {
    if (event === "restore" && snapshot) {
      this.listeners.forEach((listener) => listener(snapshot));
    }
  }

  /**
   * Check if restore is in progress
   */
  isRestoring(): boolean {
    return this.restoreInProgress;
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SnapshotRestorerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SnapshotRestorerConfig {
    return { ...this.config };
  }
}
