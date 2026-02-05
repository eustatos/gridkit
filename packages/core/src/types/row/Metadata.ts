/**
 * Row-level metadata.
 */
export interface RowMeta {
  /** CSS class names */
  readonly className?: string;

  /** Inline styles */
  readonly style?: Record<string, string>;

  /** Row height override */
  readonly height?: number;

  /** Is row disabled */
  readonly disabled?: boolean;

  /** Custom properties */
  readonly [key: string]: unknown;
}

/**
 * Row model metadata and statistics.
 */
export interface RowModelMeta {
  /** Total processing time */
  readonly processingTime: number;

  /** Memory usage estimate */
  readonly memoryUsage: number;

  /** Cache hit rates */
  readonly cacheStats: CacheStats;

  /** Custom statistics */
  readonly [key: string]: unknown;
}

/**
 * Cell metadata from column definition.
 */
export interface CellMeta {
  /** Is cell editable */
  readonly editable?: boolean;

  /** Validation rules */
  readonly validation?: CellValidation;

  /** CSS classes */
  readonly className?: string;

  /** Inline styles */
  readonly style?: Record<string, string>;

  /** Data type for formatting */
  readonly type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';

  /** Formatting options */
  readonly format?: CellFormat;

  /** Tooltip content */
  readonly tooltip?: string;

  /** Custom properties */
  readonly [key: string]: unknown;
}

/**
 * Cell validation rules.
 */
export interface CellValidation {
  /** Required field */
  readonly required?: boolean;

  /** Minimum value (numbers/dates) */
  readonly min?: number | Date;

  /** Maximum value (numbers/dates) */
  readonly max?: number | Date;

  /** Pattern for strings */
  readonly pattern?: RegExp;

  /** Custom validation function */
  readonly validate?: (value: unknown) => ValidationResult;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly message?: string;
  readonly errors?: ValidationError[];
}

/**
 * Cell position information for virtualization.
 */
export interface CellPosition {
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}