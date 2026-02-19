import type { RowData , CellId } from '../base';
import type { Column } from '../column';

import type { CellMeta, CellPosition } from './Metadata';
import type { Row } from './Row';

/**
 * Represents a single table cell with data and UI state.
 * Immutable by design - all methods return new values.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type (inferred from column)
 *
 * @example
 * ```typescript
 * const cell = row.getCell('name');
 * const value = cell.getValue(); // Typed as string
 * const rendered = cell.renderValue(); // Rendered content
 * ```
 */
export interface Cell<TData extends RowData, TValue = unknown> {
  // === Identification ===

  /**
   * Unique cell identifier: `${rowId}_${columnId}`
   * Used for O(1) lookups and focus management.
   */
  readonly id: CellId;

  /**
   * Parent row instance.
   */
  readonly row: Row<TData>;

  /**
   * Parent column instance with typed accessor.
   */
  readonly column: Column<TData, TValue>;

  // === Data Access ===

  /**
   * Get typed cell value.
   * Uses column's accessor (key or function).
   *
   * @returns The cell value with correct type
   */
  getValue(): TValue;

  /**
   * Render cell using column's cell renderer.
   * Returns framework-agnostic representation.
   *
   * @returns Rendered cell content
   */
  renderValue(): unknown;

  // === State ===

  /**
   * Check if cell is currently focused.
   * For keyboard navigation and editing.
   */
  getIsFocused(): boolean;

  /**
   * Check if cell is currently selected.
   * Part of range selection.
   */
  getIsSelected(): boolean;

  /**
   * Check if cell is editable.
   * Based on column configuration and row state.
   */
  getIsEditable(): boolean;

  // === Metadata ===

  /**
   * Cell metadata from column definition.
   */
  readonly meta: CellMeta;

  /**
   * Cell index in row (0-based).
   */
  readonly index: number;

  /**
   * Absolute position in table (for virtualization).
   */
  readonly position?: CellPosition;
}