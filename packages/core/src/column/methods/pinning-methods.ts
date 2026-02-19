// Pinning methods for columns
import type { RowData } from '@/types';
import type { ValidatedColumnDef } from '@/types/column';
import type { ColumnId } from '@/types/column/SupportingTypes';
import type { Table } from '@/types/table';

/**
 * Builds pinning-related methods for column instance.
 */
export function buildPinningMethods<TData extends RowData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
) {
  const tableState = () => table.getState();

  return {
    // Pinning
    getPinnedPosition: () => {
      const pinning = tableState().columnPinning;
      const colId = columnDef.id;
      if (pinning?.left?.includes(colId)) return 'left';
      if (pinning?.right?.includes(colId)) return 'right';
      return false;
    },

    togglePinned: (position?: 'left' | 'right' | false) => {
      if (!columnDef.enablePinning) return;

      table.setState((prev) => {
        const currentPinning = prev.columnPinning ?? { left: [], right: [] };
        const colId = columnDef.id;
        const isLeft = currentPinning.left?.includes(colId);
        const isRight = currentPinning.right?.includes(colId);

        const nextPinning = { ...currentPinning };

        if (
          position === false ||
          (position === undefined && (isLeft || isRight))
        ) {
          // Unpin from whichever side
          if (isLeft) {
            nextPinning.left = nextPinning.left?.filter(
              (id) => id !== colId
            );
          }
          if (isRight) {
            nextPinning.right = nextPinning.right?.filter(
              (id) => id !== colId
            );
          }
        } else if (position === 'left') {
          // Pin to left (remove from right if present)
          nextPinning.left = [...(nextPinning.left ?? []), colId];
          nextPinning.right = nextPinning.right?.filter(
            (id) => id !== colId
          );
        } else if (position === 'right') {
          // Pin to right (remove from left if present)
          nextPinning.right = [...(nextPinning.right ?? []), colId];
          nextPinning.left = nextPinning.left?.filter(
            (id) => id !== colId
          );
        }

        return { ...prev, columnPinning: nextPinning };
      });
    },
  };
}
