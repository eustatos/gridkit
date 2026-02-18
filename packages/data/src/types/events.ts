import type { RowData } from '@gridkit/core/types';

/**
 * Data update listener.
 */
export type DataListener<TData extends RowData> = (
  event: DataEvent<TData>
) => void;

/**
 * Data change event.
 */
export interface DataEvent<TData extends RowData> {
  /**
   * Event type.
   */
  type: DataEventType;

  /**
   * Event data.
   */
  data: TData[];

  /**
   * Affected row IDs.
   */
  rowIds?: RowId[];

  /**
   * Change metadata.
   */
  meta?: DataEventMeta;

  /**
   * Event timestamp.
   */
  timestamp: number;
}

/**
 * Data event types.
 */
export type DataEventType =
  | 'data:loaded' // Initial load
  | 'data:changed' // Data modified
  | 'data:added' // Rows added
  | 'data:updated' // Rows updated
  | 'data:removed' // Rows removed
  | 'data:refreshed' // Full refresh
  | 'data:error' // Error occurred
  | 'data:progress' // Loading progress
  | 'data:cancelled'; // Operation cancelled

/**
 * Data event metadata.
 */
export interface DataEventMeta {
  /**
   * Operation source.
   */
  source?: string;

  /**
   * Operation ID.
   */
  operationId?: string;

  /**
   * Progress information.
   */
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };

  /**
   * Custom metadata.
   */
  [key: string]: unknown;
}
