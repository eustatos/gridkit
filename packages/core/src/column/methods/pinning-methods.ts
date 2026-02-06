// Pinning methods for columns
import type { ValidatedColumnDef } from '../validation/validate-column';
import type { Table } from '@/types/table/Table';

/**
 * Builds pinning-related methods for column instance.
 */
export function buildPinningMethods<TData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
) {
  const tableState = () => table.getState();

  return {
    // Pinning
    getPinnedPosition: () => {
      const pinning = tableState().columnPinning;
      if (pinning?.left?.includes(columnDef.id!)) return 'left';
      if (pinning?.right?.includes(columnDef.id!)) return 'right';
      return false;
    },

    togglePinned: (position?: 'left' | 'right' | false) => {
      if (!columnDef.enablePinning) return;

      table.setState((prev) => {
        const currentPinning = prev.columnPinning ?? { left: [], right: [] };
        const isLeft = currentPinning.left?.includes(columnDef.id!);
        const isRight = currentPinning.right?.includes(columnDef.id!);

        let nextPinning = { ...currentPinning };

        if (
          position === false ||
          (position === undefined && (isLeft || isRight))
        ) {
          // Unpin from whichever side
          if (isLeft) {
            nextPinning.left = nextPinning.left?.filter(
              (id) => id !== columnDef.id
            );
          }
          if (isRight) {
            nextPinning.right = nextPinning.right?.filter(
              (id) => id !== columnDef.id
            );
          }
        } else if (position === 'left') {
          // Pin to left (remove from right if present)
          nextPinning.left = [...(nextPinning.left ?? []), columnDef.id!];
          nextPinning.right = nextPinning.right?.filter(
            (id) => id !== columnDef.id
          );
        } else if (position === 'right') {
          // Pin to right (remove from left if present)
          nextPinning.right = [...(nextPinning.right ?? []), columnDef.id!];
          nextPinning.left = nextPinning.left?.filter(
            (id) => id !== columnDef.id
          );
        }

        return { ...prev, columnPinning: nextPinning };
      });
    },
  };
}