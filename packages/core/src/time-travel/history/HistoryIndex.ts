/**
 * HistoryIndex - Manages position and navigation within a history array
 * Provides index-based navigation without storing the actual items
 */

import type { IndexPosition, IndexRange, HistoryBounds } from "./types";

export class HistoryIndex {
  private totalLength: number;
  private currentIndex: number;

  /**
   * Create a new HistoryIndex
   * @param totalLength Total length of the history
   * @param currentIndex Current position (default: -1 for no position)
   */
  constructor(totalLength: number = 0, currentIndex: number = -1) {
    this.totalLength = Math.max(0, totalLength);
    this.currentIndex = this.validateIndex(currentIndex) ? currentIndex : -1;
  }

  /**
   * Validate if index is within bounds
   * @param index Index to validate
   * @returns True if valid
   */
  private validateIndex(index: number): boolean {
    return index >= -1 && index < this.totalLength;
  }

  /**
   * Get current index
   */
  get index(): number {
    return this.currentIndex;
  }

  /**
   * Get total length
   */
  get length(): number {
    return this.totalLength;
  }

  /**
   * Check if current position is valid
   */
  hasValidPosition(): boolean {
    return this.currentIndex >= 0 && this.currentIndex < this.totalLength;
  }

  /**
   * Get current position info
   */
  getPosition(): IndexPosition {
    return {
      index: this.currentIndex,
      total: this.totalLength,
      isValid: this.hasValidPosition(),
      isFirst: this.currentIndex === 0,
      isLast: this.currentIndex === this.totalLength - 1,
      hasPrevious: this.canMovePrevious(),
      hasNext: this.canMoveNext(),
    };
  }

  /**
   * Get navigation bounds
   */
  getBounds(): HistoryBounds {
    return {
      minIndex: 0,
      maxIndex: this.totalLength - 1,
      currentIndex: this.currentIndex,
      canUndo: this.canMovePrevious(),
      canRedo: this.canMoveNext(),
      remainingUndo: this.currentIndex,
      remainingRedo: this.totalLength - 1 - this.currentIndex,
    };
  }

  /**
   * Move to specific index
   * @param index Target index
   * @returns True if move was successful
   */
  moveTo(index: number): boolean {
    if (index >= 0 && index < this.totalLength) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }

  /**
   * Move to previous position
   * @param steps Number of steps back
   * @returns True if move was successful
   */
  movePrevious(steps: number = 1): boolean {
    const targetIndex = this.currentIndex - steps;
    if (targetIndex >= 0) {
      this.currentIndex = targetIndex;
      return true;
    }
    return false;
  }

  /**
   * Move to next position
   * @param steps Number of steps forward
   * @returns True if move was successful
   */
  moveNext(steps: number = 1): boolean {
    const targetIndex = this.currentIndex + steps;
    if (targetIndex < this.totalLength) {
      this.currentIndex = targetIndex;
      return true;
    }
    return false;
  }

  /**
   * Move to first position
   */
  moveToFirst(): boolean {
    if (this.totalLength > 0) {
      this.currentIndex = 0;
      return true;
    }
    return false;
  }

  /**
   * Move to last position
   */
  moveToLast(): boolean {
    if (this.totalLength > 0) {
      this.currentIndex = this.totalLength - 1;
      return true;
    }
    return false;
  }

  /**
   * Check if can move to previous
   */
  canMovePrevious(steps: number = 1): boolean {
    return this.currentIndex - steps >= 0;
  }

  /**
   * Check if can move to next
   */
  canMoveNext(steps: number = 1): boolean {
    return this.currentIndex + steps < this.totalLength;
  }

  /**
   * Get relative index from current position
   * @param offset Offset from current position
   * @returns Index or -1 if out of bounds
   */
  getRelativeIndex(offset: number): number {
    const targetIndex = this.currentIndex + offset;
    return targetIndex >= 0 && targetIndex < this.totalLength
      ? targetIndex
      : -1;
  }

  /**
   * Get range of indices
   * @param start Start index (inclusive)
   * @param end End index (inclusive)
   */
  getRange(start: number, end: number): IndexRange {
    const validStart = Math.max(0, Math.min(start, this.totalLength - 1));
    const validEnd = Math.max(0, Math.min(end, this.totalLength - 1));

    if (validStart > validEnd) {
      return {
        start: validStart,
        end: validEnd,
        length: 0,
        indices: [],
        isValid: false,
      };
    }

    return {
      start: validStart,
      end: validEnd,
      length: validEnd - validStart + 1,
      indices: Array.from(
        { length: validEnd - validStart + 1 },
        (_, i) => validStart + i,
      ),
      isValid: true,
    };
  }

  /**
   * Get all indices
   */
  getAllIndices(): number[] {
    return Array.from({ length: this.totalLength }, (_, i) => i);
  }

  /**
   * Get indices before current
   * @param includeCurrent Whether to include current index
   */
  getIndicesBefore(includeCurrent: boolean = false): number[] {
    const end = includeCurrent ? this.currentIndex : this.currentIndex - 1;
    if (end < 0) return [];
    return Array.from({ length: end + 1 }, (_, i) => i);
  }

  /**
   * Get indices after current
   * @param includeCurrent Whether to include current index
   */
  getIndicesAfter(includeCurrent: boolean = false): number[] {
    const start = includeCurrent ? this.currentIndex : this.currentIndex + 1;
    if (start >= this.totalLength) return [];
    return Array.from(
      { length: this.totalLength - start },
      (_, i) => start + i,
    );
  }

  /**
   * Update total length
   * @param newLength New total length
   * @param preservePosition Try to preserve current position
   */
  updateLength(newLength: number, preservePosition: boolean = true): void {
    const oldLength = this.totalLength;
    this.totalLength = Math.max(0, newLength);

    if (preservePosition) {
      // Clamp current index to new bounds
      this.currentIndex = Math.min(this.currentIndex, this.totalLength - 1);
    } else if (this.totalLength === 0) {
      this.currentIndex = -1;
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.totalLength = 0;
    this.currentIndex = -1;
  }

  /**
   * Check if index is within bounds
   * @param index Index to check
   */
  isValidIndex(index: number): boolean {
    return index >= 0 && index < this.totalLength;
  }

  /**
   * Get distance from current index to target
   * @param targetIndex Target index
   * @returns Distance (positive = forward, negative = backward)
   */
  distanceTo(targetIndex: number): number {
    if (!this.isValidIndex(targetIndex)) return NaN;
    return targetIndex - this.currentIndex;
  }

  /**
   * Get steps needed to reach target
   * @param targetIndex Target index
   * @returns Number of steps (absolute value)
   */
  stepsTo(targetIndex: number): number {
    return Math.abs(this.distanceTo(targetIndex));
  }

  /**
   * Calculate new index after adding items
   * @param addedCount Number of items added
   * @param position Where items were added ('before' or 'after' current)
   */
  calculateAfterAdd(addedCount: number, position: "before" | "after"): number {
    this.totalLength += addedCount;

    if (position === "before") {
      // Items added before current shift current index right
      this.currentIndex += addedCount;
    }
    // Items added after don't affect current index

    return this.currentIndex;
  }

  /**
   * Calculate new index after removing items
   * @param removedCount Number of items removed
   * @param position Where items were removed ('before' or 'after' current)
   */
  calculateAfterRemove(
    removedCount: number,
    position: "before" | "after",
  ): number {
    this.totalLength = Math.max(0, this.totalLength - removedCount);

    if (position === "before") {
      // Items removed before current shift current index left
      this.currentIndex = Math.max(-1, this.currentIndex - removedCount);
    }

    // Clamp current index
    if (this.totalLength === 0) {
      this.currentIndex = -1;
    } else {
      this.currentIndex = Math.min(this.currentIndex, this.totalLength - 1);
    }

    return this.currentIndex;
  }

  /**
   * Create a copy
   */
  clone(): HistoryIndex {
    return new HistoryIndex(this.totalLength, this.currentIndex);
  }

  /**
   * Convert to plain object
   */
  toJSON(): object {
    return {
      totalLength: this.totalLength,
      currentIndex: this.currentIndex,
      position: this.getPosition(),
      bounds: this.getBounds(),
    };
  }

  /**
   * Create from JSON
   * @param json JSON object
   */
  static fromJSON(json: any): HistoryIndex {
    return new HistoryIndex(
      json.totalLength || 0,
      json.currentIndex !== undefined ? json.currentIndex : -1,
    );
  }

  /**
   * Create from array length
   * @param array Array to get length from
   * @param currentIndex Current index
   */
  static fromArray<T>(array: T[], currentIndex: number = -1): HistoryIndex {
    return new HistoryIndex(array.length, currentIndex);
  }

  /**
   * Compare two indices
   * @param a First index
   * @param b Second index
   */
  static compare(a: HistoryIndex, b: HistoryIndex): number {
    if (a.totalLength !== b.totalLength) return a.totalLength - b.totalLength;
    return a.currentIndex - b.currentIndex;
  }

  /**
   * Check if two indices are equal
   * @param a First index
   * @param b Second index
   */
  static equals(a: HistoryIndex, b: HistoryIndex): boolean {
    return a.totalLength === b.totalLength && a.currentIndex === b.currentIndex;
  }
}
