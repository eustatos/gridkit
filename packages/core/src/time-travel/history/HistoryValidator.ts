/**
 * HistoryValidator - Validates history operations and snapshots
 */

import type {
  ValidationRule,
  ValidationWarning,
  ValidationResult,
  HistorySearchCriteria,
  HistorySearchResult,
} from "./types";
import type { Snapshot } from "../types";

export class HistoryValidator {
  private rules: ValidationRule[] = [];
  private warnings: ValidationWarning[] = [];

  constructor(customRules?: ValidationRule[]) {
    if (customRules) {
      this.rules = customRules;
    } else {
      this.setupDefaultRules();
    }
  }

  /**
   * Setup default validation rules
   */
  private setupDefaultRules(): void {
    this.rules = [
      {
        name: "snapshot_id_unique",
        validate: (snapshots: Snapshot[]) => {
          const ids = snapshots.map((s) => s.id);
          const uniqueIds = new Set(ids);
          return ids.length === uniqueIds.size;
        },
        message: "Duplicate snapshot IDs found",
        level: "error",
      },
      {
        name: "snapshot_timestamp_ordered",
        validate: (snapshots: Snapshot[]) => {
          for (let i = 1; i < snapshots.length; i++) {
            if (
              snapshots[i].metadata.timestamp <
              snapshots[i - 1].metadata.timestamp
            ) {
              return false;
            }
          }
          return true;
        },
        message: "Snapshots are not in chronological order",
        level: "warning",
      },
      {
        name: "snapshot_has_atoms",
        validate: (snapshot: Snapshot) => {
          return Object.keys(snapshot.state).length > 0;
        },
        message: "Snapshot has no atoms",
        level: "warning",
      },
      {
        name: "snapshot_has_timestamp",
        validate: (snapshot: Snapshot) => {
          return (
            typeof snapshot.metadata.timestamp === "number" &&
            snapshot.metadata.timestamp > 0
          );
        },
        message: "Snapshot has invalid timestamp",
        level: "error",
      },
      {
        name: "snapshot_atom_values_valid",
        validate: (snapshot: Snapshot) => {
          return Object.values(snapshot.state).every(
            (entry) =>
              entry.value !== undefined &&
              typeof entry.type === "string" &&
              typeof entry.name === "string",
          );
        },
        message: "Snapshot contains invalid atom entries",
        level: "error",
      },
    ];
  }

  /**
   * Validate a single snapshot
   * @param snapshot Snapshot to validate
   */
  validateSnapshot(snapshot: Snapshot): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.rules.forEach((rule) => {
      try {
        const isValid = rule.validate(snapshot);
        if (!isValid) {
          if (rule.level === "error") {
            errors.push(rule.message);
          } else {
            warnings.push(rule.message);
          }
        }
      } catch (error) {
        errors.push(`Rule ${rule.name} failed: ${error}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate a sequence of snapshots
   * @param snapshots Array of snapshots to validate
   */
  validateSequence(snapshots: Snapshot[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check each snapshot
    snapshots.forEach((snapshot, index) => {
      const result = this.validateSnapshot(snapshot);
      if (!result.isValid) {
        errors.push(`Snapshot at index ${index}: ${result.errors.join(", ")}`);
      }
      warnings.push(
        ...result.warnings.map((w) => `Snapshot at index ${index}: ${w}`),
      );
    });

    // Check sequence-specific rules
    this.rules.forEach((rule) => {
      if (rule.validate.length > 1) {
        // Rule expects multiple snapshots
        try {
          const isValid = rule.validate(snapshots);
          if (!isValid) {
            if (rule.level === "error") {
              errors.push(rule.message);
            } else {
              warnings.push(rule.message);
            }
          }
        } catch (error) {
          errors.push(`Sequence rule ${rule.name} failed: ${error}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * Add custom validation rule
   * @param rule Rule to add
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove validation rule
   * @param ruleName Name of rule to remove
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter((r) => r.name !== ruleName);
  }

  /**
   * Get all validation rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Clear all warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Search snapshots by criteria
   * @param snapshots Snapshots to search
   * @param criteria Search criteria
   */
  searchSnapshots(
    snapshots: Snapshot[],
    criteria: HistorySearchCriteria,
  ): HistorySearchResult {
    const startTime = Date.now();

    const matches = snapshots.filter((snapshot) => {
      // Search by action
      if (criteria.action) {
        const action = snapshot.metadata.action || "";
        if (criteria.action instanceof RegExp) {
          if (!criteria.action.test(action)) return false;
        } else if (!action.includes(criteria.action)) {
          return false;
        }
      }

      // Search by time range
      if (criteria.timeRange) {
        const timestamp = snapshot.metadata.timestamp;
        if (
          timestamp < criteria.timeRange.start ||
          timestamp > criteria.timeRange.end
        ) {
          return false;
        }
      }

      // Search by atom value
      if (criteria.atomValue) {
        const entry = snapshot.state[criteria.atomValue.name];
        if (!entry) return false;

        switch (criteria.atomValue.operator) {
          case "eq":
            if (entry.value !== criteria.atomValue.value) return false;
            break;
          case "neq":
            if (entry.value === criteria.atomValue.value) return false;
            break;
          case "gt":
            if (entry.value <= criteria.atomValue.value) return false;
            break;
          case "lt":
            if (entry.value >= criteria.atomValue.value) return false;
            break;
          case "regex":
            if (criteria.atomValue.value instanceof RegExp) {
              if (!criteria.atomValue.value.test(String(entry.value)))
                return false;
            }
            break;
        }
      }

      // Search by ID
      if (criteria.id) {
        if (Array.isArray(criteria.id)) {
          if (!criteria.id.includes(snapshot.id)) return false;
        } else if (snapshot.id !== criteria.id) {
          return false;
        }
      }

      // Custom filter
      if (criteria.filter && !criteria.filter(snapshot)) {
        return false;
      }

      return true;
    });

    return {
      snapshots: matches,
      total: matches.length,
      metadata: {
        searchTime: Date.now() - startTime,
        criteria,
        executionTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Find differences between two history sequences
   * @param oldSnapshots Old sequence
   * @param newSnapshots New sequence
   */
  diffHistories(
    oldSnapshots: Snapshot[],
    newSnapshots: Snapshot[],
  ): HistoryDiff {
    const added: Snapshot[] = [];
    const removed: Snapshot[] = [];
    const changed: Array<{ old: Snapshot; new: Snapshot }> = [];

    const oldMap = new Map(oldSnapshots.map((s) => [s.id, s]));
    const newMap = new Map(newSnapshots.map((s) => [s.id, s]));

    // Find added and changed
    newSnapshots.forEach((snapshot) => {
      const old = oldMap.get(snapshot.id);
      if (!old) {
        added.push(snapshot);
      } else if (JSON.stringify(old.state) !== JSON.stringify(snapshot.state)) {
        changed.push({ old, new: snapshot });
      }
    });

    // Find removed
    oldSnapshots.forEach((snapshot) => {
      if (!newMap.has(snapshot.id)) {
        removed.push(snapshot);
      }
    });

    return {
      hasChanges: added.length > 0 || removed.length > 0 || changed.length > 0,
      added,
      removed,
      changed,
      stats: {
        addedCount: added.length,
        removedCount: removed.length,
        changedCount: changed.length,
        totalChanges: added.length + removed.length + changed.length,
      },
    };
  }

  /**
   * Check if snapshot exists in history
   * @param snapshots History snapshots
   * @param snapshotId ID to check
   */
  hasSnapshot(snapshots: Snapshot[], snapshotId: string): boolean {
    return snapshots.some((s) => s.id === snapshotId);
  }

  /**
   * Find snapshot by ID
   * @param snapshots History snapshots
   * @param snapshotId ID to find
   */
  findSnapshotById(
    snapshots: Snapshot[],
    snapshotId: string,
  ): Snapshot | undefined {
    return snapshots.find((s) => s.id === snapshotId);
  }

  /**
   * Find snapshots by action name
   * @param snapshots History snapshots
   * @param actionName Action name to find
   */
  findSnapshotsByAction(
    snapshots: Snapshot[],
    actionName: string | RegExp,
  ): Snapshot[] {
    if (actionName instanceof RegExp) {
      return snapshots.filter((s) => actionName.test(s.metadata.action || ""));
    }
    return snapshots.filter((s) => s.metadata.action === actionName);
  }

  /**
   * Get snapshots in time range
   * @param snapshots History snapshots
   * @param start Start timestamp
   * @param end End timestamp
   */
  getSnapshotsInTimeRange(
    snapshots: Snapshot[],
    start: number,
    end: number,
  ): Snapshot[] {
    return snapshots.filter(
      (s) => s.metadata.timestamp >= start && s.metadata.timestamp <= end,
    );
  }
}
