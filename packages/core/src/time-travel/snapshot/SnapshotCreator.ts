/**
 * SnapshotCreator - Creates snapshots from store state
 */

import { Atom, Store } from "../../types";
import type { Snapshot, SnapshotStateEntry } from "../types";
import type { SnapshotCreatorConfig, CreationResult } from "./types";
import { atomRegistry } from "../../atom-registry";

export class SnapshotCreator {
  private store: Store;
  private config: SnapshotCreatorConfig;
  private listeners: Set<(snapshot: Snapshot) => void> = new Set();

  constructor(store: Store, config?: Partial<SnapshotCreatorConfig>) {
    this.store = store;
    this.config = {
      includeTypes: ["primitive", "computed", "writable"],
      excludeAtoms: [],
      transform: null,
      validate: true,
      generateId: () => Math.random().toString(36).substring(2, 9),
      ...config,
    };
  }

  /**
   * Create a snapshot
   * @param action Optional action name
   * @param atomIds Set of atom IDs to include
   * @returns Created snapshot or null if creation failed
   */
  create(action?: string, atomIds?: Set<symbol>): Snapshot | null {
    try {
      const state = this.captureState(atomIds);

      if (Object.keys(state).length === 0) {
        return null;
      }

      const snapshot: Snapshot = {
        id: this.config.generateId(),
        state,
        metadata: {
          timestamp: Date.now(),
          action,
          atomCount: Object.keys(state).length,
        },
      };

      // Apply transforms
      const transformed = this.config.transform
        ? this.config.transform(snapshot)
        : snapshot;

      // Validate if configured
      if (this.config.validate && !this.validateSnapshot(transformed)) {
        return null;
      }

      this.emit("create", transformed);
      return transformed;
    } catch (error) {
      console.error("Failed to create snapshot:", error);
      return null;
    }
  }

  /**
   * Create multiple snapshots
   * @param count Number of snapshots to create
   * @param actionPattern Action name pattern
   * @returns Array of created snapshots
   */
  createBatch(count: number, actionPattern?: string): Snapshot[] {
    const snapshots: Snapshot[] = [];

    for (let i = 0; i < count; i++) {
      const action = actionPattern ? `${actionPattern}-${i + 1}` : undefined;
      const snapshot = this.create(action);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    return snapshots;
  }

  /**
   * Create snapshot with result info
   * @param action Optional action name
   * @param atomIds Set of atom IDs to include
   * @returns Creation result with metadata
   */
  createWithResult(action?: string, atomIds?: Set<symbol>): CreationResult {
    const startTime = Date.now();

    try {
      const snapshot = this.create(action, atomIds);

      return {
        success: !!snapshot,
        snapshot,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: snapshot ? undefined : "Failed to create snapshot",
      };
    } catch (error) {
      return {
        success: false,
        snapshot: null,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Capture current state
   * @param atomIds Set of atom IDs to include
   * @returns Captured state
   */
  private captureState(
    atomIds?: Set<symbol>,
  ): Record<string, SnapshotStateEntry> {
    const state: Record<string, SnapshotStateEntry> = {};

    if (!atomIds) return state;

    atomIds.forEach((atomId) => {
      try {
        const atom = this.getAtomById(atomId);
        if (!atom) return;

        const atomType = this.getAtomType(atom);

        // Filter by type
        if (!this.config.includeTypes.includes(atomType)) return;

        // Filter by exclude list
        const atomName = atom.name || atomId.description || String(atomId);
        if (this.config.excludeAtoms.includes(atomName)) return;

        const value = this.store.get(atom);

        state[atomName] = {
          value: this.serializeValue(value),
          type: atomType,
          name: atomName,
          atomId: atomId.toString(),
        };
      } catch (error) {
        // Skip atoms that can't be accessed
      }
    });

    return state;
  }

  /**
   * Get atom by ID
   * @param atomId Atom ID
   * @returns Atom or undefined
   */
  private getAtomById(atomId: symbol): Atom<unknown> | undefined {
    return atomRegistry.get(atomId);
  }

  /**
   * Get atom type
   * @param atom Atom
   * @returns Atom type
   */
  private getAtomType(atom: Atom<unknown>): string {
    if (atom && typeof atom === "object" && "type" in atom) {
      return (atom as { type: string }).type;
    }
    return "primitive";
  }

  /**
   * Serialize value for storage
   * @param value Value to serialize
   * @returns Serialized value
   */
  private serializeValue(value: unknown): unknown {
    // Handle special cases
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.source;
    if (value instanceof Map) return Array.from(value.entries());
    if (value instanceof Set) return Array.from(value);

    // Return as is for primitive types
    return value;
  }

  /**
   * Validate snapshot
   * @param snapshot Snapshot to validate
   * @returns True if valid
   */
  private validateSnapshot(snapshot: Snapshot): boolean {
    if (!snapshot.id) return false;
    if (!snapshot.metadata || !snapshot.metadata.timestamp) return false;
    if (typeof snapshot.state !== "object") return false;

    return true;
  }

  /**
   * Subscribe to creation events
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
  private emit(event: "create" | "error", snapshot?: Snapshot): void {
    if (event === "create" && snapshot) {
      this.listeners.forEach((listener) => listener(snapshot));
    }
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SnapshotCreatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SnapshotCreatorConfig {
    return { ...this.config };
  }
}
