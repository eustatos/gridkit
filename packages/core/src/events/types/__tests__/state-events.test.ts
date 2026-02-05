// State Events Tests
// Implements CORE-005B test requirements for state events

import { describe, it, expect } from 'vitest';
import type {
  StateUpdateEvent,
  StateTransactionEvent,
  StateCommitEvent,
  StateResetEvent,
  StatePatchEvent,
  StateEventType,
  TableState,
  StateOperation,
} from '../state';

// Test fixtures
const TEST_GRID_ID = 'test-grid-123';

// Test data type
interface TestDataType {
  id: string;
  name: string;
  value: number;
}

// Test state
const createTestState = (): TableState<TestDataType> => ({
  data: [
    { id: '1', name: 'Item 1', value: 100 },
    { id: '2', name: 'Item 2', value: 200 },
  ],
  columns: [
    { id: 'id', header: 'ID' },
    { id: 'name', header: 'Name' },
    { id: 'value', header: 'Value' },
  ],
});

describe('State Events', () => {
  describe('StateUpdateEvent', () => {
    const createStateUpdateEvent = <TData = unknown>(): StateUpdateEvent<TData> => ({
      type: 'state:update',
      payload: {
        gridId: TEST_GRID_ID,
        previousState: { data: [], columns: [] } as TableState<TData>,
        newState: { data: [], columns: [] } as TableState<TData>,
        changedKeys: ['data'],
        source: 'test',
      },
      timestamp: Date.now(),
    });

    it('should create a valid StateUpdateEvent', () => {
      const event = createStateUpdateEvent<TestDataType>();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:update');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.previousState).toBeDefined();
      expect(event.payload.newState).toBeDefined();
      expect(event.payload.changedKeys).toEqual(['data']);
      expect(event.payload.source).toBe('test');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of StateEventType union', () => {
      const event: StateEventType<TestDataType> = createStateUpdateEvent<TestDataType>();
      expect(event.type).toBe('state:update');
    });

    it('should support generic state types', () => {
      const event = createStateUpdateEvent<TestDataType>();
      const state = createTestState();
      
      // This test ensures that the generic type is preserved
      expect(event.payload.previousState).toBeDefined();
      expect(event.payload.newState).toBeDefined();
    });
  });

  describe('StateTransactionEvent', () => {
    const createStateTransactionEvent = (): StateTransactionEvent => ({
      type: 'state:transaction',
      payload: {
        gridId: TEST_GRID_ID,
        transactionId: 'txn-123',
        operations: [
          {
            type: 'set',
            path: 'data.0.name',
            value: 'Updated Item',
            previousValue: 'Item 1',
          },
        ] as StateOperation[],
        metadata: { user: 'test-user' },
      },
      timestamp: Date.now(),
    });

    it('should create a valid StateTransactionEvent', () => {
      const event = createStateTransactionEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:transaction');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.transactionId).toBe('txn-123');
      expect(event.payload.operations).toHaveLength(1);
      expect(event.payload.metadata).toBeDefined();
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of StateEventType union', () => {
      const event: StateEventType = createStateTransactionEvent();
      expect(event.type).toBe('state:transaction');
    });
  });

  describe('StateCommitEvent', () => {
    const createStateCommitEvent = <TData = unknown>(): StateCommitEvent<TData> => ({
      type: 'state:commit',
      payload: {
        gridId: TEST_GRID_ID,
        state: { data: [], columns: [] } as TableState<TData>,
        timestamp: Date.now(),
        source: 'test',
      },
      timestamp: Date.now(),
    });

    it('should create a valid StateCommitEvent', () => {
      const event = createStateCommitEvent<TestDataType>();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:commit');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.state).toBeDefined();
      expect(event.payload.timestamp).toBeGreaterThan(0);
      expect(event.payload.source).toBe('test');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of StateEventType union', () => {
      const event: StateEventType<TestDataType> = createStateCommitEvent<TestDataType>();
      expect(event.type).toBe('state:commit');
    });
  });

  describe('StateResetEvent', () => {
    const createStateResetEvent = <TData = unknown>(): StateResetEvent<TData> => ({
      type: 'state:reset',
      payload: {
        gridId: TEST_GRID_ID,
        previousState: { data: [], columns: [] } as TableState<TData>,
        newState: { data: [], columns: [] } as TableState<TData>,
        reason: 'test-reset',
      },
      timestamp: Date.now(),
    });

    it('should create a valid StateResetEvent', () => {
      const event = createStateResetEvent<TestDataType>();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:reset');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.previousState).toBeDefined();
      expect(event.payload.newState).toBeDefined();
      expect(event.payload.reason).toBe('test-reset');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of StateEventType union', () => {
      const event: StateEventType<TestDataType> = createStateResetEvent<TestDataType>();
      expect(event.type).toBe('state:reset');
    });
  });

  describe('StatePatchEvent', () => {
    const createStatePatchEvent = <TData = unknown>(): StatePatchEvent<TData> => ({
      type: 'state:patch',
      payload: {
        gridId: TEST_GRID_ID,
        patch: { data: [] } as Partial<TableState<TData>>,
        previousState: { data: [], columns: [] } as TableState<TData>,
        newState: { data: [], columns: [] } as TableState<TData>,
      },
      timestamp: Date.now(),
    });

    it('should create a valid StatePatchEvent', () => {
      const event = createStatePatchEvent<TestDataType>();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:patch');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.patch).toBeDefined();
      expect(event.payload.previousState).toBeDefined();
      expect(event.payload.newState).toBeDefined();
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of StateEventType union', () => {
      const event: StateEventType<TestDataType> = createStatePatchEvent<TestDataType>();
      expect(event.type).toBe('state:patch');
    });
  });

  describe('State Event Type Safety', () => {
    it('should enforce correct payload types', () => {
      const event = {
        type: 'state:update',
        payload: {
          gridId: TEST_GRID_ID,
          previousState: { data: [], columns: [] },
          newState: { data: [], columns: [] },
          changedKeys: ['data'],
          source: 'test',
        },
        timestamp: Date.now(),
      } as StateUpdateEvent<TestDataType>;
      
      // This test ensures that the payload has the correct type
      expect(typeof event.payload.gridId).toBe('string');
      expect(event.payload.previousState).toBeDefined();
      expect(event.payload.newState).toBeDefined();
      expect(Array.isArray(event.payload.changedKeys)).toBe(true);
      expect(typeof event.payload.source).toBe('string');
    });

    it('should enforce event type string validation', () => {
      const event = {
        type: 'state:update' as const,
        payload: {
          gridId: TEST_GRID_ID,
          previousState: { data: [], columns: [] },
          newState: { data: [], columns: [] },
          changedKeys: ['data'],
          source: 'test',
        },
        timestamp: Date.now(),
      } as const;
      
      // This test ensures that the event type is a valid string literal
      expect(event.type).toBe('state:update');
    });

    it('should preserve generic state types', () => {
      const state = createTestState();
      const event = {
        type: 'state:update',
        payload: {
          gridId: TEST_GRID_ID,
          previousState: state,
          newState: state,
          changedKeys: ['data'],
          source: 'test',
        },
        timestamp: Date.now(),
      } as StateUpdateEvent<TestDataType>;
      
      // This test ensures that the generic type is preserved
      expect(event.payload.previousState.data).toBeDefined();
      expect(event.payload.newState.data).toBeDefined();
      // Type checking would catch if the generic type was not preserved
    });
  });
});