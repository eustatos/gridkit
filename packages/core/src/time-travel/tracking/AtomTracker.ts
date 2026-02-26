/**
 * AtomTracker - Tracks atoms and their metadata
 */

import { Atom, Store } from "../../types";
import type {
  TrackerConfig,
  TrackedAtom,
  TrackingEvent,
  TrackingStats,
  AtomMetadata,
  TrackerSnapshot,
  TrackerRestorePoint,
} from "./types";

// Import disposal infrastructure
import { BaseDisposable, type DisposableConfig } from "../core/disposable";

export class AtomTracker extends BaseDisposable {
  private atoms: Map<symbol, TrackedAtom> = new Map();
  private atomsByName: Map<string, symbol> = new Map();
  private store: Store;
  private trackerConfig: TrackerConfig;
  private listeners: Set<(event: TrackingEvent) => void> = new Set();
  private version: number = 0;
  private startTime: number = Date.now();

  constructor(
    store: any,
    config?: Partial<TrackerConfig>,
    disposalConfig?: DisposableConfig,
  ) {
    super(disposalConfig);
    this.store = store;
    // Extract only TrackerConfig properties, explicitly excluding DisposableConfig
    const trackerConfig = config as Partial<TrackerConfig> | undefined;
    this.trackerConfig = {
      autoTrack: true,
      maxAtoms: 1000,
      trackComputed: true,
      trackWritable: true,
      trackPrimitive: true,
      validateOnTrack: true,
      trackAccess: true,
      trackChanges: true,
      ...(trackerConfig || {}),
    };
  }

  /**
   * Track an atom
   * @param atom Atom to track
   * @param name Optional name
   * @returns True if tracking started
   */
  track<Value>(atom: Atom<Value>, name?: string): boolean {
    console.log(`[TRACKER.track] Tracking atom: ${atom.name}, id: ${atom.id?.toString()}, atoms.size: ${this.atoms.size}`);

    if (this.atoms.size >= this.trackerConfig.maxAtoms) {
      this.emit("error", { message: "Max atoms limit reached" });
      return false;
    }

    if (this.atoms.has(atom.id)) {
      console.log(`[TRACKER.track] Atom already tracked!`);
      return true; // Already tracked
    }

    // Validate atom type
    const type = this.getAtomType(atom as Atom<unknown>);
    if (!this.shouldTrackType(type)) {
      return false;
    }

    // Validate if configured
    if (
      this.trackerConfig.validateOnTrack &&
      !this.validateAtom(atom as Atom<unknown>)
    ) {
      return false;
    }

    const displayName =
      name || atom.name || this.generateName(atom as Atom<unknown>);

    const trackedAtom: TrackedAtom = {
      id: atom.id,
      atom,
      name: displayName,
      type,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      accessCount: 0,
      changeCount: 0,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        accessCount: 0,
        changeCount: 0,
      },
    };

    this.atoms.set(atom.id, trackedAtom);
    this.atomsByName.set(displayName, atom.id);
    this.version++;

    this.emit("track", { atom: trackedAtom });
    return true;
  }

  /**
   * Track multiple atoms
   * @param atoms Atoms to track
   * @returns Number successfully tracked
   */
  trackMany<Value>(atoms: Atom<Value>[]): number {
    let tracked = 0;
    atoms.forEach((atom) => {
      if (this.track(atom)) {
        tracked++;
      }
    });
    return tracked;
  }

  /**
   * Untrack an atom
   * @param atom Atom to untrack
   * @returns True if untracked
   */
  untrack<Value>(atom: Atom<Value>): boolean {
    const tracked = this.atoms.get(atom.id);
    if (!tracked) return false;

    this.atoms.delete(atom.id);
    this.atomsByName.delete(tracked.name);
    this.version++;

    this.emit("untrack", { atom: tracked });
    return true;
  }

  /**
   * Untrack multiple atoms
   * @param atoms Atoms to untrack
   * @returns Number successfully untracked
   */
  untrackMany<Value>(atoms: Atom<Value>[]): number {
    let untracked = 0;
    atoms.forEach((atom) => {
      if (this.untrack(atom)) {
        untracked++;
      }
    });
    return untracked;
  }

  /**
   * Check if atom is tracked
   * @param atom Atom to check
   */
  isTracked<Value>(atom: Atom<Value>): boolean {
    return this.atoms.has(atom.id);
  }

  /**
   * Get tracked atom by ID
   * @param id Atom ID
   */
  getTrackedAtom(id: symbol): TrackedAtom | undefined {
    return this.atoms.get(id);
  }

  /**
   * Get atom by name
   * @param name Atom name
   */
  getAtomByName(name: string): Atom<unknown> | undefined {
    const id = this.atomsByName.get(name);
    if (!id) return undefined;
    return this.atoms.get(id)?.atom;
  }

  /**
   * Get all tracked atoms
   */
  getTrackedAtoms(): Atom<unknown>[] {
    return Array.from(this.atoms.values()).map((t) => t.atom);
  }

  /**
   * Get all tracked atoms with metadata
   */
  getAllTracked(): TrackedAtom[] {
    return Array.from(this.atoms.values());
  }

  /**
   * Get atoms by type
   * @param type Atom type
   */
  getAtomsByType(type: string): TrackedAtom[] {
    return Array.from(this.atoms.values()).filter((t) => t.type === type);
  }

  /**
   * Record atom access
   * @param atom Atom accessed
   */
  recordAccess(atom: Atom<unknown>): void {
    const tracked = this.atoms.get(atom.id);
    if (tracked) {
      tracked.accessCount++;
      tracked.lastSeen = Date.now();
      tracked.metadata.accessCount++;
      tracked.metadata.updatedAt = Date.now();
    }
  }

  /**
   * Record atom change
   * @param atom Atom changed
   * @param oldValue Previous value
   * @param newValue New value
   */
  recordChange<Value>(
    atom: Atom<Value>,
    oldValue: Value,
    newValue: Value,
  ): void {
    const tracked = this.atoms.get(atom.id);
    if (tracked) {
      tracked.changeCount++;
      tracked.lastSeen = Date.now();
      tracked.metadata.changeCount++;
      tracked.metadata.updatedAt = Date.now();

      this.emit("change", {
        atom: tracked,
        oldValue,
        newValue,
      });
    }
  }

  /**
   * Get tracking statistics
   */
  getStats(): TrackingStats {
    const atoms = this.getAllTracked();
    const byType = this.getTypeDistribution();

    const accessStats = atoms.reduce(
      (acc, atom) => {
        return {
          total: acc.total + atom.accessCount,
          min: Math.min(acc.min, atom.accessCount),
          max: Math.max(acc.max, atom.accessCount),
          avg: 0, // Will calculate after
        };
      },
      { total: 0, min: Infinity, max: 0, avg: 0 },
    );

    accessStats.avg = atoms.length ? accessStats.total / atoms.length : 0;

    // Find most accessed atom
    let mostAccessed: TrackedAtom | null = null;
    let maxAccess = -1;
    atoms.forEach((atom) => {
      if (atom.accessCount > maxAccess) {
        maxAccess = atom.accessCount;
        mostAccessed = atom;
      }
    });

    // Find most changed atom
    let mostChanged: TrackedAtom | null = null;
    let maxChange = -1;
    atoms.forEach((atom) => {
      if (atom.changeCount > maxChange) {
        maxChange = atom.changeCount;
        mostChanged = atom;
      }
    });

    // Find oldest atom
    let oldestAtom: TrackedAtom | null = null;
    let oldestTime = Infinity;
    atoms.forEach((atom) => {
      if (atom.firstSeen < oldestTime) {
        oldestTime = atom.firstSeen;
        oldestAtom = atom;
      }
    });

    // Find newest atom
    let newestAtom: TrackedAtom | null = null;
    let newestTime = -1;
    atoms.forEach((atom) => {
      if (atom.firstSeen > newestTime) {
        newestTime = atom.firstSeen;
        newestAtom = atom;
      }
    });

    return {
      totalAtoms: atoms.length,
      byType,
      accessCount: accessStats.total,
      changeCount: atoms.reduce((sum, a) => sum + a.changeCount, 0),
      averageAccesses: accessStats.avg,
      mostAccessed,
      mostChanged,
      oldestAtom,
      newestAtom,
      version: this.version,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get type distribution
   */
  private getTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.atoms.forEach((atom) => {
      distribution[atom.type] = (distribution[atom.type] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get atom type
   * @param atom Atom
   */
  private getAtomType(atom: any): string {
    if (atom && typeof atom === "object" && "type" in atom) {
      return (atom as { type: string }).type;
    }
    return "primitive";
  }

  /**
   * Check if type should be tracked
   * @param type Atom type
   */
  private shouldTrackType(type: string): boolean {
    switch (type) {
      case "primitive":
        return this.trackerConfig.trackPrimitive;
      case "computed":
        return this.trackerConfig.trackComputed;
      case "writable":
        return this.trackerConfig.trackWritable;
      default:
        return true;
    }
  }

  /**
   * Validate atom
   * @param atom Atom to validate
   */
  private validateAtom(atom: any): boolean {
    return !!(atom && atom.id && typeof atom.id === "symbol");
  }

  /**
   * Generate name for atom
   * @param atom Atom
   */
  private generateName(atom: any): string {
    const base = atom.name || atom.id?.description || "atom";
    let counter = 1;
    let name = base;

    while (this.atomsByName.has(name)) {
      name = `${base}_${counter++}`;
    }

    return name;
  }

  /**
   * Create a snapshot of current tracking state
   */
  snapshot(): TrackerSnapshot {
    return {
      atoms: this.getAllTracked(),
      version: this.version,
      timestamp: Date.now(),
      config: { ...this.trackerConfig },
    };
  }

  /**
   * Create a restore point
   */
  createRestorePoint(): TrackerRestorePoint {
    return {
      id: Math.random().toString(36).substring(2, 9),
      atoms: new Map(this.atoms),
      atomsByName: new Map(this.atomsByName),
      version: this.version,
      timestamp: Date.now(),
    };
  }

  /**
   * Restore from restore point
   * @param point Restore point
   */
  restore(point: TrackerRestorePoint): void {
    this.atoms = new Map(point.atoms);
    this.atomsByName = new Map(point.atomsByName);
    this.version = point.version;

    this.emit("restore", { data: { point } });
  }

  /**
   * Clear all tracked atoms
   */
  clear(): void {
    const count = this.atoms.size;
    this.atoms.clear();
    this.atomsByName.clear();
    this.version++;

    this.emit("clear", { data: { count } });
  }

  /**
   * Subscribe to tracking events
   * @param listener Event listener
   */
  subscribe(listener: (event: TrackingEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event
   * @param type Event type
   * @param data Event data
   */
  private emit(
    type: TrackingEvent["type"],
    data: Partial<TrackingEvent>,
  ): void {
    const event: TrackingEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    } as TrackingEvent;

    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<TrackerConfig>): void {
    this.trackerConfig = { ...this.trackerConfig, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TrackerConfig {
    return { ...this.trackerConfig };
  }

  /**
   * Get version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get total tracked count
   */
  size(): number {
    return this.atoms.size;
  }

  /**
   * Dispose the atom tracker and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log("Disposing AtomTracker");

    // Clear all listeners
    this.listeners.clear();

    // Clear atom references
    this.atoms.clear();
    this.atomsByName.clear();

    // Remove store reference
    // @ts-expect-error - Clean up references
    this.store = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log("AtomTracker disposed");
  }
}
