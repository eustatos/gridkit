/**
 * Tracking module types
 */

/**
 * Configuration for AtomTracker
 */
export interface TrackerConfig {
  /** Automatically track new atoms */
  autoTrack: boolean;

  /** Maximum number of atoms to track */
  maxAtoms: number;

  /** Track computed atoms */
  trackComputed: boolean;

  /** Track writable atoms */
  trackWritable: boolean;

  /** Track primitive atoms */
  trackPrimitive: boolean;

  /** Validate atoms before tracking */
  validateOnTrack: boolean;

  /** Track atom access patterns */
  trackAccess: boolean;

  /** Track atom changes */
  trackChanges: boolean;

  /** Sample rate for tracking (0-1) */
  sampleRate?: number;
}

/**
 * Tracked atom metadata
 */
export interface TrackedAtom {
  /** Atom ID */
  id: symbol;

  /** Atom reference */
  atom: any;

  /** Display name */
  name: string;

  /** Atom type */
  type: string;

  /** First seen timestamp */
  firstSeen: number;

  /** Last seen timestamp */
  lastSeen: number;

  /** Access count */
  accessCount: number;

  /** Change count */
  changeCount: number;

  /** Additional metadata */
  metadata: AtomMetadata;
}

/**
 * Atom metadata
 */
export interface AtomMetadata {
  /** Creation timestamp */
  createdAt: number;

  /** Last update timestamp */
  updatedAt: number;

  /** Access count */
  accessCount: number;

  /** Change count */
  changeCount: number;

  /** Custom tags */
  tags?: string[];

  /** Custom metadata */
  custom?: Record<string, any>;
}

/**
 * Tracking event
 */
export interface TrackingEvent {
  /** Event type */
  type:
    | "track"
    | "untrack"
    | "change"
    | "access"
    | "error"
    | "clear"
    | "restore";

  /** Event timestamp */
  timestamp: number;

  /** Tracked atom (if applicable) */
  atom?: TrackedAtom;

  /** Old value (for change events) */
  oldValue?: any;

  /** New value (for change events) */
  newValue?: any;

  /** Error message (for error events) */
  message?: string;

  /** Additional data */
  data?: any;
}

/**
 * Tracking statistics
 */
export interface TrackingStats {
  /** Total atoms tracked */
  totalAtoms: number;

  /** Distribution by type */
  byType: Record<string, number>;

  /** Total access count */
  accessCount: number;

  /** Total change count */
  changeCount: number;

  /** Average accesses per atom */
  averageAccesses: number;

  /** Most accessed atom */
  mostAccessed: TrackedAtom | null;

  /** Most changed atom */
  mostChanged: TrackedAtom | null;

  /** Oldest tracked atom */
  oldestAtom: TrackedAtom | null;

  /** Newest tracked atom */
  newestAtom: TrackedAtom | null;

  /** Current version */
  version: number;

  /** Tracker uptime in ms */
  uptime: number;
}

/**
 * Change event
 */
export interface ChangeEvent {
  /** Changed atom */
  atom: any;

  /** Atom ID */
  atomId: symbol;

  /** Atom name */
  atomName: string;

  /** Old value */
  oldValue: any;

  /** New value */
  newValue: any;

  /** Change timestamp */
  timestamp: number;

  /** Change type */
  type: "created" | "deleted" | "value" | "type" | "unknown";
}

/**
 * Change listener
 */
export type ChangeListener = (event: ChangeEvent) => void;

/**
 * Change filter
 */
export type ChangeFilter = (event: ChangeEvent) => boolean;

/**
 * Change batch
 */
export interface ChangeBatch {
  /** Changes in batch */
  changes: ChangeEvent[];

  /** Number of changes */
  count: number;

  /** Batch start time */
  startTime: number;

  /** Batch end time */
  endTime: number;

  /** Unique atoms changed */
  atoms: Set<symbol>;
}

/**
 * Computed atom configuration
 */
export interface ComputedAtomConfig {
  /** Lazy evaluation */
  lazy: boolean;

  /** Enable caching */
  cache: boolean;

  /** Cache TTL in ms */
  cacheTTL?: number;

  /** Invalidate on dependency change */
  invalidateOnChange: boolean;

  /** Recompute strategy */
  strategy?: "eager" | "lazy" | "debounced";

  /** Debounce wait time in ms */
  debounceWait?: number;

  /** Maximum cache size */
  maxCacheSize?: number;
}

/**
 * Computed dependency
 */
export interface ComputedDependency {
  /** Source atom */
  atom: any;

  /** Optional value transform */
  transform?: (value: any) => any;
}

/**
 * Computed cache entry
 */
export interface ComputedCache {
  /** Cached value */
  value: any;

  /** Cache timestamp */
  timestamp: number;

  /** Dependency values at cache time */
  dependencies: any[];
}

/**
 * Computed invalidation strategy
 */
export type ComputedInvalidationStrategy =
  | "immediate"
  | "debounced"
  | "throttled"
  | "manual";

/**
 * Atom group
 */
export interface AtomGroup {
  /** Group ID */
  id: string;

  /** Group name */
  name: string;

  /** Atom IDs in group */
  atomIds: symbol[];

  /** Group metadata */
  metadata: {
    createdAt: number;
    updatedAt: number;
    atomCount: number;
  };
}

/**
 * Atom relationship
 */
export interface AtomRelationship {
  /** Source atom ID */
  from: symbol;

  /** Target atom ID */
  to: symbol;

  /** Relationship type */
  type: "depends" | "derives" | "updates" | "subscribes";

  /** Relationship strength (0-1) */
  strength?: number;
}

/**
 * Atom subscription
 */
export interface AtomSubscription {
  /** Subscriber ID */
  id: string;

  /** Atom ID */
  atomId: symbol;

  /** Subscription type */
  type: "value" | "change" | "access";

  /** Created timestamp */
  createdAt: number;

  /** Last notified timestamp */
  lastNotified?: number;

  /** Notification count */
  notifyCount: number;
}

/**
 * Tracker snapshot
 */
export interface TrackerSnapshot {
  /** Tracked atoms */
  atoms: TrackedAtom[];

  /** Version */
  version: number;

  /** Snapshot timestamp */
  timestamp: number;

  /** Configuration */
  config: TrackerConfig;
}

/**
 * Tracker restore point
 */
export interface TrackerRestorePoint {
  /** Point ID */
  id: string;

  /** Atoms map */
  atoms: Map<symbol, TrackedAtom>;

  /** Atoms by name */
  atomsByName: Map<string, symbol>;

  /** Version */
  version: number;

  /** Timestamp */
  timestamp: number;
}
