/**
 * GridKit Row Types
 *
 * This module contains the row type system - one of the core components of GridKit.
 * Rows represent individual data records in the table. The type system supports:
 * - Access to original data
 * - Access to cells
 * - Selection state
 * - Expansion state (for grouped/tree data)
 * - Parent/child relationships (for tree data)
 *
 * @module @gridkit/core/types/row
 */

import type { RowData, RowId, ColumnId } from './base';
import type { Column } from './column';
import type { Table } from './table';

/**
 * Represents a single table cell.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @example
 * Basic usage:
 * ```typescript
 * const cell = row.getCell('name');
 * const value = cell.getValue(); // string
 * const rendered = cell.renderValue(); // React element or string
 * ```
 *
 * @example
 * With custom value type:
 * ```typescript
 * interface User {
 *   id: number;
 *   profile: {
 *     name: string;
 *     age: number;
 *   };
 * }
 *
 * const cell = row.getCell('profile');
 * const profile = cell.getValue<User['profile']>(); // { name: string, age: number }
 * ```
 *
 * @public
 */
export interface Cell<TData extends RowData, TValue = unknown> {
  /**
   * Unique cell identifier.
   * Format: `{rowId}_{columnId}`
   *
   * @example
   * ```typescript
   * const cellId = cell.id; // "user-123_name"
   * ```
   */
  readonly id: string;

  /**
   * Parent row instance.
   */
  readonly row: Row<TData>;

  /**
   * Parent column instance.
   */
  readonly column: Column<TData, TValue>;

  /**
   * Get cell value.
   * Uses accessor defined in column.
   *
   * @returns Cell value
   *
   * @example
   * ```typescript
   * const name = cell.getValue<string>(); // "John Doe"
   * const age = cell.getValue<number>(); // 30
   * ```
   */
  getValue(): TValue;

  /**
   * Render cell using column's cell renderer.
   *
   * @returns Rendered cell content (string, React element, etc.)
   *
   * @example
   * ```typescript
   * // With React
   * const rendered = cell.renderValue(); // <div>John Doe</div>
   *
   * // With plain text
   * const text = cell.renderValue(); // "John Doe"
   * ```
   */
  renderValue(): unknown;
}

/**
 * Runtime row instance.
 * Represents a single row in the table.
 *
 * @template TData - Row data type
 *
 * @example
 * Basic usage:
 * ```typescript
 * const row = table.getRowModel().rows[0];
 * console.log(row.original); // Original data
 * console.log(row.getValue('name')); // Get specific cell value
 * ```
 *
 * @example
 * With tree data:
 * ```typescript
 * // Get parent row
 * const parent = row.parentRow;
 *
 * // Get all child rows
 * const children = row.subRows;
 *
 * // Get all ancestors
 * const ancestors = row.getParentRows();
 *
 * // Get all descendants
 * const descendants = row.getLeafRows();
 * ```
 *
 * @public
 */
export interface Row<TData extends RowData> {
  /**
   * Unique row identifier.
   * Determined by `getRowId` option or defaults to index.
   *
   * @example
   * ```typescript
   * const rowId = row.id; // "user-123" or 123
   * ```
   */
  readonly id: RowId;

  /**
   * Reference to parent table.
   */
  readonly table: Table<TData>;

  /**
   * Original row data.
   * Immutable reference to source data.
   *
   * @example
   * ```typescript
   * const user = row.original; // { id: 1, name: "John", email: "john@example.com" }
   * ```
   */
  readonly original: TData;

  /**
   * Row index in current view.
   * Changes based on sorting/filtering.
   *
   * @example
   * ```typescript
   * const position = row.index; // 0 (first row), 1 (second row), etc.
   * ```
   */
  readonly index: number;

  /**
   * Nesting depth for tree data.
   * 0 for top-level rows.
   *
   * @example
   * ```typescript
   * const depth = row.depth; // 0 (root), 1 (first child), 2 (grandchild), etc.
   * ```
   */
  readonly depth: number;

  /**
   * Get all cells for this row.
   * Includes hidden columns.
   *
   * @returns Array of all cells
   *
   * @example
   * ```typescript
   * const allCells = row.getAllCells();
   * // [Cell, Cell, Cell, ...] - includes hidden columns
   * ```
   */
  getAllCells(): Cell<TData>[];

  /**
   * Get only visible cells.
   * Respects column visibility state.
   *
   * @returns Array of visible cells
   *
   * @example
   * ```typescript
   * const visibleCells = row.getVisibleCells();
   * // [Cell, Cell, ...] - only visible columns
   * ```
   */
  getVisibleCells(): Cell<TData>[];

  /**
   * Get cell by column ID.
   *
   * @param columnId - Column identifier
   * @returns Cell instance or undefined if not found
   *
   * @example
   * ```typescript
   * const nameCell = row.getCell('name');
   * if (nameCell) {
   *   const name = nameCell.getValue<string>();
   * }
   * ```
   */
  getCell(columnId: ColumnId): Cell<TData> | undefined;

  /**
   * Get value for a specific column.
   * Shorthand for getCell(id)?.getValue().
   *
   * @template TValue - Expected value type
   * @param columnId - Column identifier
   * @returns Cell value
   *
   * @example
   * Basic usage:
   * ```typescript
   * const name = row.getValue<string>('name'); // "John Doe"
   * const age = row.getValue<number>('age'); // 30
   * ```
   *
   * @example
   * With nested properties:
   * ```typescript
   * interface User {
   *   profile: {
   *     name: string;
   *     age: number;
   *   };
   * }
   *
   * const profile = row.getValue<User['profile']>('profile');
   * // { name: string, age: number }
   * ```
   */
  getValue<TValue = unknown>(columnId: ColumnId): TValue;

  /**
   * Check if row is selected.
   *
   * @returns True if selected
   *
   * @example
   * ```typescript
   * if (row.getIsSelected()) {
   *   console.log('Row is selected');
   * }
   * ```
   */
  getIsSelected(): boolean;

  /**
   * Toggle row selection.
   *
   * @param value - New selection state (toggles if undefined)
   *
   * @example
   * Basic toggle:
   * ```typescript
   * row.toggleSelected(); // Toggle selection
   * ```
   *
   * @example
   * Explicit selection:
   * ```typescript
   * row.toggleSelected(true); // Select row
   * row.toggleSelected(false); // Deselect row
   * ```
   */
  toggleSelected(value?: boolean): void;

  /**
   * Check if row is expanded.
   * Only relevant for grouped or tree data.
   *
   * @returns True if expanded
   *
   * @example
   * ```typescript
   * if (row.getIsExpanded()) {
   *   console.log('Row is expanded, showing children');
   * }
   * ```
   */
  getIsExpanded(): boolean;

  /**
   * Toggle row expansion.
   * Only relevant for grouped or tree data.
   *
   * @param value - New expansion state (toggles if undefined)
   *
   * @example
   * ```typescript
   * row.toggleExpanded(); // Toggle expansion
   * row.toggleExpanded(true); // Expand row
   * row.toggleExpanded(false); // Collapse row
   * ```
   */
  toggleExpanded(value?: boolean): void;

  /**
   * Parent row for tree data.
   * Undefined for top-level rows.
   *
   * @example
   * ```typescript
   * const parent = row.parentRow;
   * if (parent) {
   *   console.log('This is a child row');
   * }
   * ```
   */
  parentRow?: Row<TData>;

  /**
   * Child rows for tree/grouped data.
   * Empty array if no children.
   *
   * @example
   * ```typescript
   * const children = row.subRows;
   * if (children.length > 0) {
   *   console.log(`Row has ${children.length} children`);
   * }
   * ```
   */
  subRows: Row<TData>[];

  /**
   * Get all parent rows (ancestors).
   * Returns empty array for top-level rows.
   *
   * @returns Array of parent rows from immediate to root
   *
   * @example
   * ```typescript
   * const ancestors = row.getParentRows();
   * // [immediateParent, grandparent, greatGrandparent, ...]
   * ```
   */
  getParentRows(): Row<TData>[];

  /**
   * Get all descendant rows (recursively).
   * Returns empty array if no children.
   *
   * @returns Flattened array of all descendants
   *
   * @example
   * ```typescript
   * const allDescendants = row.getLeafRows();
   * // Includes children, grandchildren, etc.
   * ```
   */
  getLeafRows(): Row<TData>[];
}

/**
 * Collection of rows with metadata.
 * Represents current table view after sorting/filtering/pagination.
 *
 * @template TData - Row data type
 *
 * @example
 * Basic usage:
 * ```typescript
 * const rowModel = table.getRowModel();
 * console.log(rowModel.rows.length); // Number of top-level rows
 * console.log(rowModel.flatRows.length); // Total rows including nested
 * ```
 *
 * @example
 * Row lookup by ID:
 * ```typescript
 * const row = rowModel.rowsById.get('user-123');
 * if (row) {
 *   console.log('Found row:', row.original);
 * }
 * ```
 *
 * @public
 */
export interface RowModel<TData extends RowData> {
  /**
   * Top-level rows in current view.
   * Does not include nested rows.
   *
   * @example
   * ```typescript
   * const topLevelRows = rowModel.rows;
   * // Only shows rows at depth 0
   * ```
   */
  rows: Row<TData>[];

  /**
   * All rows including nested (flattened).
   * Useful for total count and operations on all rows.
   *
   * @example
   * ```typescript
   * const totalRows = rowModel.flatRows.length;
   * // Includes all nested rows
   * ```
   */
  flatRows: Row<TData>[];

  /**
   * Map of row ID to row instance.
   * For O(1) lookup by ID.
   *
   * @example
   * ```typescript
   * // Fast lookup
   * const row = rowModel.rowsById.get('user-123');
   *
   * // Iterate over all rows
   * for (const [id, row] of rowModel.rowsById) {
   *   console.log(id, row.original);
   * }
   * ```
   */
  rowsById: Map<RowId, Row<TData>>;
}
