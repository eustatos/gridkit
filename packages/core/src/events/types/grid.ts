// Grid lifecycle events
// Implements CORE-005B requirement for grid lifecycle events

import type { GridEvent } from './base';

// Type definitions for grid identifiers
export type GridId = string;

// Grid initialization events
export interface GridInitEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly config: Record<string, unknown>;
  readonly timestamp: number;
}> {
  readonly type: 'grid:init';
}

export interface GridReadyEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly readyTimestamp: number;
}> {
  readonly type: 'grid:ready';
}

export interface GridDestroyEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly reason?: string;
}> {
  readonly type: 'grid:destroy';
}

// Grid state events
export interface GridStateChangeEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly property: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}> {
  readonly type: 'grid:state-change';
}

// Union type of all grid events
export type GridEventType = 
  | GridInitEvent
  | GridReadyEvent
  | GridDestroyEvent
  | GridStateChangeEvent;

// Type mapping for grid event payloads
export interface GridEventPayloadMap {
  'grid:init': GridInitEvent['payload'];
  'grid:ready': GridReadyEvent['payload'];
  'grid:destroy': GridDestroyEvent['payload'];
  'grid:state-change': GridStateChangeEvent['payload'];
}

// Helper type to get payload type by event type
export type GridEventPayload<T extends keyof GridEventPayloadMap> = GridEventPayloadMap[T];
