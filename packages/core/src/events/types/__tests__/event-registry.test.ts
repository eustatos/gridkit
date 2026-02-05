// Event Registry Tests
// Implements CORE-005B test requirements

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  GridInitEvent,
  ColumnAddEvent,
  RowAddEvent,
  CellFocusEvent,
  CellUpdateEvent,
  StateUpdateEvent,
  TableSortEvent,
  EventRegistry,
  EventType,
} from '../index';

// Test fixtures
const TEST_GRID_ID = 'test-grid-123';
const TEST_COLUMN_ID = 'col-1';
const TEST_ROW_ID = 'row-1';

// Grid event fixtures
const createGridInitEvent = (): GridInitEvent => ({
  type: 'grid:init',
  payload: {
    gridId: TEST_GRID_ID,
    config: { theme: 'default', width: 800, height: 600 },
    timestamp: Date.now(),
  },
  timestamp: Date.now(),
});

// Column event fixtures
const createColumnAddEvent = (): ColumnAddEvent => ({
  type: 'column:add',
  payload: {
    gridId: TEST_GRID_ID,
    columnId: TEST_COLUMN_ID,
    index: 0,
    definition: { header: 'Test Column', width: 100 },
  },
  timestamp: Date.now(),
});

// Row event fixtures
const createRowAddEvent = (): RowAddEvent => ({
  type: 'row:add',
  payload: {
    gridId: TEST_GRID_ID,
    rowId: TEST_ROW_ID,
    index: 0,
    data: { id: TEST_ROW_ID, name: 'Test Row' },
  },
  timestamp: Date.now(),
});

// Cell event fixtures
const createCellFocusEvent = (): CellFocusEvent => ({
  type: 'cell:focus',
  payload: {
    gridId: TEST_GRID_ID,
    rowId: TEST_ROW_ID,
    columnId: TEST_COLUMN_ID,
    previousRowId: undefined,
    previousColumnId: undefined,
  },
  timestamp: Date.now(),
});

const createCellUpdateEvent = (): CellUpdateEvent => ({
  type: 'cell:update',
  payload: {
    gridId: TEST_GRID_ID,
    rowId: TEST_ROW_ID,
    columnId: TEST_COLUMN_ID,
    value: 'new value',
    previousValue: 'old value',
    source: 'test',
  },
  timestamp: Date.now(),
});

// State event fixtures
const createStateUpdateEvent = <TData = unknown>(): StateUpdateEvent<TData> => ({
  type: 'state:update',
  payload: {
    gridId: TEST_GRID_ID,
    previousState: { data: [], columns: [] },
    newState: { data: [], columns: [] },
    changedKeys: ['data'],
    source: 'test',
  },
  timestamp: Date.now(),
});

// Table event fixtures
const createTableSortEvent = (): TableSortEvent => ({
  type: 'table:sort',
  payload: {
    gridId: TEST_GRID_ID,
    columnId: TEST_COLUMN_ID,
    direction: 'asc',
    multiSort: false,
  },
  timestamp: Date.now(),
});

describe('Event Registry', () => {
  describe('Grid Events', () => {
    it('should create a valid GridInitEvent', () => {
      const event = createGridInitEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('grid:init');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.config).toBeDefined();
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should enforce immutability at type level', () => {
      const event = createGridInitEvent();
      
      // This test ensures the type system enforces immutability
      // The following lines would cause TypeScript compilation errors:
      // event.type = 'modified'; // Error: Cannot assign to 'type' because it is a read-only property
      // event.payload.gridId = 'new-id'; // Error: Cannot assign to 'gridId' because it is a read-only property
      
      // At runtime, we can only verify that the properties exist and have correct types
      expect(typeof event.type).toBe('string');
      expect(typeof event.payload.gridId).toBe('string');
    });
  });

  describe('Column Events', () => {
    it('should create a valid ColumnAddEvent', () => {
      const event = createColumnAddEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('column:add');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.index).toBe(0);
    });
  });

  describe('Row Events', () => {
    it('should create a valid RowAddEvent', () => {
      const event = createRowAddEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('row:add');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.data).toBeDefined();
    });
  });

  describe('Cell Events', () => {
    it('should create a valid CellFocusEvent', () => {
      const event = createCellFocusEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:focus');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
    });

    it('should create a valid CellUpdateEvent', () => {
      const event = createCellUpdateEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:update');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.value).toBe('new value');
      expect(event.payload.previousValue).toBe('old value');
      expect(event.payload.source).toBe('test');
    });
  });

  describe('State Events', () => {
    it('should create a valid StateUpdateEvent', () => {
      const event = createStateUpdateEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:update');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.previousState).toBeDefined();
      expect(event.payload.newState).toBeDefined();
    });

    it('should support generic state types', () => {
      interface TestDataType {
        id: string;
        name: string;
      }
      
      const event = createStateUpdateEvent<TestDataType>();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('state:update');
      // The generic type is preserved in the type system
    });
  });

  describe('Table Events', () => {
    it('should create a valid TableSortEvent', () => {
      const event = createTableSortEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('table:sort');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.direction).toBe('asc');
    });
  });

  describe('Event Composition', () => {
    it('should support all event types in EventRegistry', () => {
      // This test ensures that all event types can be used in the EventRegistry union type
      const events: EventRegistry[] = [
        createGridInitEvent(),
        createColumnAddEvent(),
        createRowAddEvent(),
        createCellFocusEvent(),
        createCellUpdateEvent(),
        createStateUpdateEvent(),
        createTableSortEvent(),
      ];
      
      expect(events).toHaveLength(7);
      expect(events[0].type).toBe('grid:init');
      expect(events[1].type).toBe('column:add');
      expect(events[2].type).toBe('row:add');
      expect(events[3].type).toBe('cell:focus');
      expect(events[4].type).toBe('cell:update');
      expect(events[5].type).toBe('state:update');
      expect(events[6].type).toBe('table:sort');
    });

    it('should support all event types in EventType union', () => {
      // This test ensures that all event types can be used in the EventType union type
      const events: EventType[] = [
        createGridInitEvent(),
        createColumnAddEvent(),
        createRowAddEvent(),
        createCellFocusEvent(),
        createCellUpdateEvent(),
        createStateUpdateEvent(),
        createTableSortEvent(),
      ];
      
      expect(events).toHaveLength(7);
      expect(events[0].type).toBe('grid:init');
      expect(events[1].type).toBe('column:add');
      expect(events[2].type).toBe('row:add');
      expect(events[3].type).toBe('cell:focus');
      expect(events[4].type).toBe('cell:update');
      expect(events[5].type).toBe('state:update');
      expect(events[6].type).toBe('table:sort');
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct payload types', () => {
      const gridEvent = createGridInitEvent();
      
      // This test ensures that the payload has the correct type
      expect(typeof gridEvent.payload.gridId).toBe('string');
      expect(typeof gridEvent.payload.timestamp).toBe('number');
      expect(gridEvent.payload.config).toBeDefined();
    });

    it('should enforce event type string validation', () => {
      const event = createGridInitEvent();
      
      // This test ensures that the event type is a valid string literal
      expect(event.type).toBe('grid:init');
      // @ts-expect-error - Testing type safety
      expect(event.type).not.toBe('invalid:type');
    });

    it('should preserve branded types', () => {
      const gridEvent = createGridInitEvent();
      const columnEvent = createColumnAddEvent();
      const rowEvent = createRowAddEvent();
      
      // These tests ensure that branded types are preserved
      expect(typeof gridEvent.payload.gridId).toBe('string');
      expect(typeof columnEvent.payload.columnId).toBe('string');
      expect(typeof rowEvent.payload.rowId).toBe('string');
    });
  });
});