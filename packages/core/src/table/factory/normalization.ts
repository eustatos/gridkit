import type { DebugConfig } from '@/debug/types';
import type { TableState, ColumnDef, ValidatedColumnDef, RowId, RowData, DeepPartial } from '@/types';

/**
 * Normalizes debug options with sane defaults.
 */
export function normalizeDebugOptions(debug: DebugConfig | boolean | undefined): DebugConfig {
  if (debug === undefined) {
    return {
      events: false,
      performance: false,
      validation: false,
      memory: false,
      plugins: false,
      timeTravel: false,
      devtools: false,
    };
  }

  if (typeof debug === 'boolean') {
    // If debug is a boolean, enable all debug features if true
    return {
      events: debug,
      performance: debug,
      validation: debug,
      memory: debug,
      plugins: debug,
      timeTravel: debug,
      devtools: debug,
    };
  }

  // Normalize DebugConfig
  const debugConfig = debug as DebugConfig;
  return {
    events: debugConfig.events === true || (debugConfig.events as any)?.enabled || false,
    performance: debugConfig.performance === true || (debugConfig.performance as any)?.enabled || false,
    validation: debugConfig.validation || false,
    memory: debugConfig.memory === true || (debugConfig.memory as any)?.enabled || false,
    plugins: debugConfig.plugins || false,
    timeTravel: debugConfig.timeTravel === true || (debugConfig.timeTravel as any)?.enabled || false,
    devtools: debugConfig.devtools === true || (debugConfig.devtools as any)?.enabled || false,
  };
}

/**
 * Normalizes initial state options.
 */
export function normalizeInitialState<TData extends RowData>(
  initialState: DeepPartial<TableState<TData>> | undefined
): DeepPartial<TableState<TData>> {
  return initialState ?? {};
}

/**
 * Normalizes column definitions with default options.
 */
export function normalizeColumns<TData extends RowData>(
  columns: ColumnDef<TData>[],
  defaultColumn: Partial<ColumnDef<TData>> | undefined
): ValidatedColumnDef<TData>[] {
  return columns.map((column) => ({
    ...defaultColumn,
    ...column,
  })) as ValidatedColumnDef<TData>[];
}

/**
 * Default function to get row ID.
 */
export function defaultGetRowId<TData>(row: TData, index: number): RowId {
  return String(index) as RowId;
}