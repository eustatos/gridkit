import type { DebugConfig, DebugOptions, TableState, ColumnDef, ValidatedColumnDef, RowId, RowData, DeepPartial } from '../../types';

/**
 * Normalizes debug options with sane defaults.
 */
export function normalizeDebugOptions(debug: DebugConfig | DebugOptions | boolean | undefined): DebugConfig {
  if (debug === undefined) {
    return {
      logStateChanges: false,
      logPerformance: false,
      validateState: false,
      devTools: false,
      performance: false,
      events: false,
      validation: false,
      memory: false,
    };
  }

  if (typeof debug === 'boolean') {
    // If debug is a boolean, enable all debug features if true
    return {
      logStateChanges: debug,
      logPerformance: debug,
      validateState: debug,
      devTools: debug,
      performance: debug,
      events: debug,
      validation: debug,
      memory: debug,
    };
  }

  // Normalize DebugOptions to DebugConfig
  const debugObj = debug as DebugOptions;
  return {
    logStateChanges: Boolean(debugObj.logStateChanges),
    logPerformance: Boolean(debugObj.logPerformance),
    validateState: Boolean(debugObj.validateState),
    devTools: Boolean(debugObj.devTools),
    performance: Boolean((debug as DebugConfig).performance),
    events: Boolean((debug as DebugConfig).events),
    validation: Boolean((debug as DebugConfig).validation),
    memory: Boolean((debug as DebugConfig).memory),
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