// Cell Events Tests
// Implements CORE-005B test requirements for cell events

import { describe, it, expect } from 'vitest';
import type {
  CellFocusEvent,
  CellEditEvent,
  CellValueEvent,
  CellUpdateEvent,
  CellSelectEvent,
  CellHoverEvent,
  CellValidationErrorEvent,
  CellEventType,
} from '../cell';

// Test fixtures
const TEST_GRID_ID = 'test-grid-123';
const TEST_COLUMN_ID = 'col-1';
const TEST_ROW_ID = 'row-1';

describe('Cell Events', () => {
  describe('CellFocusEvent', () => {
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

    it('should create a valid CellFocusEvent', () => {
      const event = createCellFocusEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:focus');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellFocusEvent();
      expect(event.type).toBe('cell:focus');
    });
  });

  describe('CellEditEvent', () => {
    const createCellEditEvent = (): CellEditEvent => ({
      type: 'cell:edit',
      payload: {
        gridId: TEST_GRID_ID,
        rowId: TEST_ROW_ID,
        columnId: TEST_COLUMN_ID,
        value: 'new value',
        previousValue: 'old value',
      },
      timestamp: Date.now(),
    });

    it('should create a valid CellEditEvent', () => {
      const event = createCellEditEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:edit');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.value).toBe('new value');
      expect(event.payload.previousValue).toBe('old value');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellEditEvent();
      expect(event.type).toBe('cell:edit');
    });
  });

  describe('CellValueEvent', () => {
    const createCellValueEvent = (): CellValueEvent => ({
      type: 'cell:value',
      payload: {
        gridId: TEST_GRID_ID,
        rowId: TEST_ROW_ID,
        columnId: TEST_COLUMN_ID,
        value: 'cell value',
        previousValue: null,
      },
      timestamp: Date.now(),
    });

    it('should create a valid CellValueEvent', () => {
      const event = createCellValueEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:value');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.value).toBe('cell value');
      expect(event.payload.previousValue).toBeNull();
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellValueEvent();
      expect(event.type).toBe('cell:value');
    });
  });

  describe('CellUpdateEvent', () => {
    const createCellUpdateEvent = (): CellUpdateEvent => ({
      type: 'cell:update',
      payload: {
        gridId: TEST_GRID_ID,
        rowId: TEST_ROW_ID,
        columnId: TEST_COLUMN_ID,
        value: 'updated value',
        previousValue: 'previous value',
        source: 'test',
      },
      timestamp: Date.now(),
    });

    it('should create a valid CellUpdateEvent', () => {
      const event = createCellUpdateEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:update');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.value).toBe('updated value');
      expect(event.payload.previousValue).toBe('previous value');
      expect(event.payload.source).toBe('test');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellUpdateEvent();
      expect(event.type).toBe('cell:update');
    });
  });

  describe('CellSelectEvent', () => {
    const createCellSelectEvent = (): CellSelectEvent => ({
      type: 'cell:select',
      payload: {
        gridId: TEST_GRID_ID,
        rowId: TEST_ROW_ID,
        columnId: TEST_COLUMN_ID,
        selected: true,
      },
      timestamp: Date.now(),
    });

    it('should create a valid CellSelectEvent', () => {
      const event = createCellSelectEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:select');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.selected).toBe(true);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellSelectEvent();
      expect(event.type).toBe('cell:select');
    });
  });

  describe('CellHoverEvent', () => {
    const createCellHoverEvent = (): CellHoverEvent => ({
      type: 'cell:hover',
      payload: {
        gridId: TEST_GRID_ID,
        rowId: TEST_ROW_ID,
        columnId: TEST_COLUMN_ID,
        hovered: true,
      },
      timestamp: Date.now(),
    });

    it('should create a valid CellHoverEvent', () => {
      const event = createCellHoverEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:hover');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.hovered).toBe(true);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellHoverEvent();
      expect(event.type).toBe('cell:hover');
    });
  });

  describe('CellValidationErrorEvent', () => {
    const createCellValidationErrorEvent = (): CellValidationErrorEvent => ({
      type: 'cell:validation-error',
      payload: {
        gridId: TEST_GRID_ID,
        rowId: TEST_ROW_ID,
        columnId: TEST_COLUMN_ID,
        error: 'Invalid value',
        value: 'invalid',
      },
      timestamp: Date.now(),
    });

    it('should create a valid CellValidationErrorEvent', () => {
      const event = createCellValidationErrorEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('cell:validation-error');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.rowId).toBe(TEST_ROW_ID);
      expect(event.payload.columnId).toBe(TEST_COLUMN_ID);
      expect(event.payload.error).toBe('Invalid value');
      expect(event.payload.value).toBe('invalid');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of CellEventType union', () => {
      const event: CellEventType = createCellValidationErrorEvent();
      expect(event.type).toBe('cell:validation-error');
    });
  });

  describe('Cell Event Type Safety', () => {
    it('should enforce correct payload types', () => {
      const event = {
        type: 'cell:focus',
        payload: {
          gridId: TEST_GRID_ID,
          rowId: TEST_ROW_ID,
          columnId: TEST_COLUMN_ID,
          previousRowId: undefined,
          previousColumnId: undefined,
        },
        timestamp: Date.now(),
      } as CellFocusEvent;
      
      // This test ensures that the payload has the correct type
      expect(typeof event.payload.gridId).toBe('string');
      expect(typeof event.payload.rowId).toBe('string');
      expect(typeof event.payload.columnId).toBe('string');
    });

    it('should enforce event type string validation', () => {
      const event = {
        type: 'cell:focus' as const,
        payload: {
          gridId: TEST_GRID_ID,
          rowId: TEST_ROW_ID,
          columnId: TEST_COLUMN_ID,
          previousRowId: undefined,
          previousColumnId: undefined,
        },
        timestamp: Date.now(),
      } as const;
      
      // This test ensures that the event type is a valid string literal
      expect(event.type).toBe('cell:focus');
    });
  });
});