import { describe, it, expect } from 'vitest';
import type { EventRegistry, EventType, EventPayload } from '../types';

// Mock branded types for testing
const createRowId = (id: string) => id as any;
const createColumnId = (id: string) => id as any;
const createCellId = (id: string) => id as any;

describe('Event Types', () => {
  it('should have correct event registry structure', () => {
    // This test ensures that the EventRegistry type is properly defined
    // and that all required events are present with correct payload types
    
    // Test a few key events to ensure they exist and have correct types
    const rowAddEvent: EventRegistry['row:add'] = {
      rowId: createRowId('test-row'),
      index: 0,
      isNew: true,
    };
    
    const cellUpdateEvent: EventRegistry['cell:update'] = {
      cellId: createCellId('test-cell'),
      rowId: createRowId('test-row'),
      columnId: createColumnId('test-column'),
      value: 'new value',
      oldValue: 'old value',
    };
    
    const selectionChangeEvent: EventRegistry['selection:change'] = {
      selectedIds: [createRowId('row-1'), createRowId('row-2')],
    };
    
    expect(rowAddEvent).toBeDefined();
    expect(cellUpdateEvent).toBeDefined();
    expect(selectionChangeEvent).toBeDefined();
  });

  it('should extract correct event types', () => {
    // Test that EventType correctly extracts all event keys
    const eventType: EventType = 'row:add';
    expect(eventType).toBe('row:add');
    
    // Test a few more event types
    const eventTypes: EventType[] = [
      'column:resize',
      'grid:init',
      'data:load',
      'state:update',
      'validation:error',
    ];
    
    expect(eventTypes).toHaveLength(5);
  });

  it('should extract correct payload types', () => {
    // Test that EventPayload correctly extracts payload types
    const rowAddPayload: EventPayload<'row:add'> = {
      rowId: createRowId('test'),
      index: 0,
      isNew: true,
    };
    
    const dataLoadPayload: EventPayload<'data:load'> = {
      data: [],
      source: 'initial',
    };
    
    const stateUpdatePayload: EventPayload<'state:update'> = {
      previousState: {} as any,
      newState: {} as any,
      changedKeys: [],
    };
    
    expect(rowAddPayload).toBeDefined();
    expect(dataLoadPayload).toBeDefined();
    expect(stateUpdatePayload).toBeDefined();
  });
});