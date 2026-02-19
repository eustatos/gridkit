/**
 * Row Factory System - Usage Examples
 */

import { createRow, buildRowModel, RowRegistry } from '../factory';

import type { RowData } from '@/types';
import type { Column } from '@/types/column/ColumnInstance';
import type { Table } from '@/types/table/Table';

// Example 1: Creating a single row
function exampleCreateRow<TData extends RowData>(
  data: TData,
  index: number,
  columns: Column<TData>[],
  getRowId: (row: TData, index: number) => string,
  table: Table<TData>
) {
  const row = createRow({
    originalData: data,
    originalIndex: index,
    columns,
    getRowId,
    table,
  });

  const nameCell = row.getCell('name');
  const nameValue = row.getValue<string>('name');
  const originalName = row.getOriginalValue('name');

  return row;
}

// Example 2: Building row model from data array
function exampleBuildRowModel<TData extends RowData>(
  data: TData[],
  columns: Column<TData>[],
  getRowId: (row: TData, index: number) => string,
  table: Table<TData>
) {
  const model = buildRowModel({
    data,
    columns,
    getRowId,
    table,
  });

  const row = model.getRow('user-123');
  const rowByIndex = model.getRowByOriginalIndex(0);
  const filtered = model.filterRows((row) => row.original.isActive);
  const found = model.findRow((row) => row.original.name === 'Alice');
  const selectedRows = model.getSelectedRows();
  const expandedRows = model.getExpandedRows();

  console.log(`Processed ${model.totalRowCount} rows in ${model.meta.processingTime}ms`);

  return model;
}

// Example 3: Using RowRegistry for efficient indexing
function exampleRowRegistry<TData extends RowData>(
  data: TData[],
  columns: Column<TData>[],
  getRowId: (row: TData, index: number) => string,
  table: Table<TData>
) {
  const registry = new RowRegistry<TData>();

  data.forEach((item, index) => {
    const row = createRow({
      originalData: item,
      originalIndex: index,
      columns,
      getRowId,
      table,
    });
    registry.add(row);
  });

  const row1 = registry.getById('user-1');
  const row2 = registry.getByOriginalIndex(2);
  const children = registry.getChildren('parent-id');
  const allRows = registry.getAll();
  const stats = registry.getStats();
  console.log(`Total rows: ${stats.totalRows}`);

  return registry;
}

// Example 4: Performance with large datasets
function examplePerformance<TData extends RowData>(
  data: TData[],
  columns: Column<TData>[],
  getRowId: (row: TData, index: number) => string,
  table: Table<TData>
) {
  const start = performance.now();
  const model = buildRowModel({
    data,
    columns,
    getRowId,
    table,
  });
  const end = performance.now();

  console.log(`Built model with ${model.totalRowCount} rows in ${end - start}ms`);

  const row = model.getRow('user-1');
  const cell1 = row.getCell('name');
  const cell2 = row.getCell('name');
  const cell3 = row.getCell('name');

  console.log(cell1 === cell2 && cell2 === cell3); // true

  return model;
}

// Example 5: Hierarchical data support
function exampleHierarchicalData<TData extends RowData>(
  data: TData[],
  columns: Column<TData>[],
  getRowId: (row: TData, index: number) => string,
  table: Table<TData>
) {
  const parentRow = createRow({
    originalData: { id: 1, name: 'Parent' },
    originalIndex: 0,
    columns,
    getRowId,
    table,
  });

  const childRow = createRow({
    originalData: { id: 2, name: 'Child' },
    originalIndex: 1,
    columns,
    getRowId,
    table,
    parentRow,
    depth: 1,
    path: ['1'],
  });

  console.log(childRow.parentRow?.id); // '1'
  console.log(childRow.depth); // 1
  console.log(childRow.getPath()); // ['1', '2']

  const registry = new RowRegistry<TData>();
  registry.add(parentRow);
  registry.add(childRow);

  const children = registry.getChildren('1');
  console.log(children.length); // 1

  return { parentRow, childRow, registry };
}

export {
  exampleCreateRow,
  exampleBuildRowModel,
  exampleRowRegistry,
  examplePerformance,
  exampleHierarchicalData,
};
