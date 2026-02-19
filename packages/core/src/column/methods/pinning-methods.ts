// Pinning methods for columns
import type { ValidatedColumnDef } from '@/types/column';

import type { RowData } from '@/types';
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
      if (pinning?.left?.includes(columnDef.id as string)) return 'left';
      if (pinning?.right?.includes(columnDef.id as string)) return 'right';
      return false;
    },

    togglePinned: (position?: 'left' | 'right' | false) => {
      if (!columnDef.enablePinning) return;

      table.setState((prev) => {
        const currentPinning = prev.columnPinning ?? { left: [], right: [] };
        const isLeft = currentPinning.left?.includes(columnDef.id as string);
        const isRight = currentPinning.right?.includes(columnDef.id as string);

        const nextPinning = { ...currentPinning };

        if (
          position === false ||
          (position === undefined && (isLeft || isRight))
        ) {
          // Unpin from whichever side
          if (isLeft) {
            nextPinning.left = nextPinning.left?.filter(
              (id) => id !== columnDef.id as string
            );
          }
          if (isRight) {
            nextPinning.right = nextPinning.right?.filter(
              (id) => id !== columnDef.id as string
            );
          }
        } else if (position === 'left') {
          // Pin to left (remove from right if present)
          nextPinning.left = [...(nextPinning.left ?? []), columnDef.id as string];
          nextPinning.right = nextPinning.right?.filter(
            (id) => id !== columnDef.id as string
          );
        } else if (position === 'right') {
          // Pin to right (remove from left if present)
          nextPinning.right = [...(nextPinning.right ?? []), columnDef.id as string];
          nextPinning.left = nextPinning.left?.filter(
            (id) => id !== columnDef.id as string
          );
        }

        return { ...prev, columnPinning: nextPinning };
      });
    },
  };
}
