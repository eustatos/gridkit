/**
 * Normalizes debug options with sane defaults.
 */
function normalizeDebugOptions(debug: DebugConfig | undefined): DebugConfig {
  if (debug === undefined) {
    return {
      performance: false,
      validation: false,
      events: false,
      memory: false,
    };
  }

  return {
    performance: Boolean(debug.performance),
    validation: Boolean(debug.validation),
    events: Boolean(debug.events),
    memory: Boolean(debug.memory),
  };
}

/**
 * Normalizes initial state options.
 */
function normalizeInitialState<TData>(
  initialState: Partial<TableState<TData>> | undefined
): Partial<TableState<TData>> {
  return initialState ?? {};
}

/**
 * Normalizes column definitions with default options.
 */
function normalizeColumns<TData>(
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
function defaultGetRowId<TData>(row: TData, index: number): RowId {
  return index.toString();
}