/**
 * Table metadata (user-defined).
 */
export interface TableMeta {
  /** User-friendly table name */
  readonly name?: string;

  /** Table description */
  readonly description?: string;

  /** Any custom application data */
  readonly [key: string]: unknown;
}
