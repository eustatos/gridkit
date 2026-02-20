// Factory function for creating and registering all columns

import type { Column, RowData } from '@/types';
import type { ValidatedColumnDef } from '@/types/column';
import type { Table } from '@/types/table';

import { createColumn } from './create-column';

/**
 * Options for creating multiple columns.
 */
export interface CreateColumnsOptions<TData extends RowData> {
  columnDefs: ValidatedColumnDef<TData>[];
  table: Table<TData>;
  registry: any; // ColumnRegistry
}

/**
 * Creates and registers all column instances from definitions.
 * Calls the registry.register() method for each column.
 */
export function createColumns<TData extends RowData>(
  options: CreateColumnsOptions<TData>
): Column<TData>[] {
  const { columnDefs, table, registry } = options;
  
  const columns: Column<TData>[] = [];
  
  for (const columnDef of columnDefs) {
    const column = createColumn({
      columnDef,
      table,
    });
    
    // Register column in registry
    registry.register(column);
    columns.push(column);
  }
  
  return columns;
}
