// State management events (CORE-006 Integration)
// Implements CORE-005B requirement for state management events

import type { GridEvent } from './base';
import type { GridId } from './grid';

// Placeholder for TableState type (to be implemented in CORE-001/CORE-002)
export type TableState<TData = unknown> = {
  readonly data: readonly TData[];
  readonly columns: readonly unknown[];
  readonly selection?: unknown;
  readonly sorting?: unknown;
  readonly filtering?: unknown;
  readonly pagination?: unknown;
};

// State operation type for transactions
export type StateOperation = {
  readonly type: string;
  readonly path: string;
  readonly value: unknown;
  readonly previousValue: unknown;
};

// State update events
export interface StateUpdateEvent<TData = unknown> extends GridEvent<{
  readonly gridId: GridId;
  readonly previousState: TableState<TData>;
  readonly newState: TableState<TData>;
  readonly changedKeys: readonly string[];
  readonly source?: string;
}> {
  readonly type: 'state:update';
}

// State transaction events
export interface StateTransactionEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly transactionId: string;
  readonly operations: readonly StateOperation[];
  readonly metadata?: Record<string, unknown>;
}> {
  readonly type: 'state:transaction';
}

// State commit events
export interface StateCommitEvent<TData = unknown> extends GridEvent<{
  readonly gridId: GridId;
  readonly state: TableState<TData>;
  readonly timestamp: number;
  readonly source?: string;
}> {
  readonly type: 'state:commit';
}

// State reset events
export interface StateResetEvent<TData = unknown> extends GridEvent<{
  readonly gridId: GridId;
  readonly previousState: TableState<TData>;
  readonly newState: TableState<TData>;
  readonly reason?: string;
}> {
  readonly type: 'state:reset';
}

// State patch events
export interface StatePatchEvent<TData = unknown> extends GridEvent<{
  readonly gridId: GridId;
  readonly patch: Partial<TableState<TData>>;
  readonly previousState: TableState<TData>;
  readonly newState: TableState<TData>;
}> {
  readonly type: 'state:patch';
}

// Union type of all state events
export type StateEventType<TData = unknown> = 
  | StateUpdateEvent<TData>
  | StateTransactionEvent
  | StateCommitEvent<TData>
  | StateResetEvent<TData>
  | StatePatchEvent<TData>;

// Type mapping for state event payloads
export interface StateEventPayloadMap {
  'state:update': StateUpdateEvent<unknown>['payload'];
  'state:transaction': StateTransactionEvent['payload'];
  'state:commit': StateCommitEvent<unknown>['payload'];
  'state:reset': StateResetEvent<unknown>['payload'];
  'state:patch': StatePatchEvent<unknown>['payload'];
}

// Helper type to get payload type by event type
export type StateEventPayload<T extends keyof StateEventPayloadMap> = StateEventPayloadMap[T];