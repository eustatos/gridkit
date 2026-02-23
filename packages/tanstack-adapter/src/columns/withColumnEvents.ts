/**
 * Event Column Enhancer for TanStack Table
 *
 * Adds event emission capabilities to column definitions using GridKit's EventBus.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { EventBus, GridEvent } from '@gridkit/core/events'

/**
 * Event handlers for column events
 */
export interface ColumnEventHandlers<TData, TValue = unknown> {
  onEdit?: (value: TValue, row: TData, rowIndex: number) => void
  onClick?: (value: TValue, row: TData, rowIndex: number) => void
  onFocus?: (value: TValue, row: TData, rowIndex: number) => void
}

/**
 * Eventful column definition type
 */
export interface EventfulColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  onCellEdit?: (value: TValue, row: TData, rowIndex: number) => void
  onCellClick?: (value: TValue, row: TData, rowIndex: number) => void
  onCellFocus?: (value: TValue, row: TData, rowIndex: number) => void
  eventEmitter?: EventBus
}

/**
 * Create an eventful column definition
 *
 * @param column - Base column definition
 * @param eventEmitter - GridKit EventBus instance
 * @param handlers - Event handlers
 * @returns Eventful column definition
 *
 * @example
 * ```typescript
 * const eventfulColumn = withColumnEvents(
 *   { accessorKey: 'name', header: 'Name' },
 *   eventEmitter,
 *   {
 *     onClick: (value, row, index) => {
 *       console.log('Clicked:', value)
 *     },
 *     onEdit: (value, row, index) => {
 *       console.log('Edited:', value)
 *     }
 *   }
 * )
 * ```
 */
export function withColumnEvents<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  eventEmitter: EventBus,
  handlers?: ColumnEventHandlers<TData, TValue>
): EventfulColumnDef<TData, TValue> {
  return {
    ...column,
    eventEmitter,
    onCellEdit: handlers?.onEdit,
    onCellClick: handlers?.onClick,
    onCellFocus: handlers?.onFocus,

    // Enhance cell to emit events
    cell: (info) => {
      const baseCell = typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()

      const value = info.getValue() as TValue
      const row = info.row.original
      const rowIndex = info.row.index

      // Emit cell:render event
      eventEmitter.emit({
        type: 'cell:render',
        payload: { 
          columnId: column.id,
          value, 
          row, 
          rowIndex 
        }
      } as GridEvent)

      // Emit cell:click event on cell click (would be triggered by cell component)
      if (handlers?.onClick) {
        eventEmitter.emit({
          type: 'cell:click',
          payload: {
            columnId: column.id,
            value,
            row,
            rowIndex,
          }
        } as GridEvent)
      }

      return baseCell
    },
  } as EventfulColumnDef<TData, TValue>
}
