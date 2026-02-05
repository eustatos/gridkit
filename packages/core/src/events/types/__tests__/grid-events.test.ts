// Grid Events Tests
// Implements CORE-005B test requirements for grid events

import { describe, it, expect } from 'vitest';
import type {
  GridInitEvent,
  GridReadyEvent,
  GridDestroyEvent,
  GridResizeEvent,
  GridStateChangeEvent,
  GridEventType,
} from '../grid';

// Test fixtures
const TEST_GRID_ID = 'test-grid-123';

describe('Grid Events', () => {
  describe('GridInitEvent', () => {
    const createGridInitEvent = (): GridInitEvent => ({
      type: 'grid:init',
      payload: {
        gridId: TEST_GRID_ID,
        config: { theme: 'default', width: 800, height: 600 },
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });

    it('should create a valid GridInitEvent', () => {
      const event = createGridInitEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('grid:init');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.config).toBeDefined();
      expect(event.payload.timestamp).toBeGreaterThan(0);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of GridEventType union', () => {
      const event: GridEventType = createGridInitEvent();
      expect(event.type).toBe('grid:init');
    });
  });

  describe('GridReadyEvent', () => {
    const createGridReadyEvent = (): GridReadyEvent => ({
      type: 'grid:ready',
      payload: {
        gridId: TEST_GRID_ID,
        readyTimestamp: Date.now(),
      },
      timestamp: Date.now(),
    });

    it('should create a valid GridReadyEvent', () => {
      const event = createGridReadyEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('grid:ready');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.readyTimestamp).toBeGreaterThan(0);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of GridEventType union', () => {
      const event: GridEventType = createGridReadyEvent();
      expect(event.type).toBe('grid:ready');
    });
  });

  describe('GridDestroyEvent', () => {
    const createGridDestroyEvent = (): GridDestroyEvent => ({
      type: 'grid:destroy',
      payload: {
        gridId: TEST_GRID_ID,
        reason: 'Test cleanup',
      },
      timestamp: Date.now(),
    });

    it('should create a valid GridDestroyEvent', () => {
      const event = createGridDestroyEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('grid:destroy');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.reason).toBe('Test cleanup');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of GridEventType union', () => {
      const event: GridEventType = createGridDestroyEvent();
      expect(event.type).toBe('grid:destroy');
    });
  });

  describe('GridResizeEvent', () => {
    const createGridResizeEvent = (): GridResizeEvent => ({
      type: 'grid:resize',
      payload: {
        gridId: TEST_GRID_ID,
        width: 1024,
        height: 768,
        previousWidth: 800,
        previousHeight: 600,
      },
      timestamp: Date.now(),
    });

    it('should create a valid GridResizeEvent', () => {
      const event = createGridResizeEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('grid:resize');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.width).toBe(1024);
      expect(event.payload.height).toBe(768);
      expect(event.payload.previousWidth).toBe(800);
      expect(event.payload.previousHeight).toBe(600);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of GridEventType union', () => {
      const event: GridEventType = createGridResizeEvent();
      expect(event.type).toBe('grid:resize');
    });
  });

  describe('GridStateChangeEvent', () => {
    const createGridStateChangeEvent = (): GridStateChangeEvent => ({
      type: 'grid:state-change',
      payload: {
        gridId: TEST_GRID_ID,
        property: 'theme',
        oldValue: 'light',
        newValue: 'dark',
      },
      timestamp: Date.now(),
    });

    it('should create a valid GridStateChangeEvent', () => {
      const event = createGridStateChangeEvent();
      
      expect(event).toBeDefined();
      expect(event.type).toBe('grid:state-change');
      expect(event.payload.gridId).toBe(TEST_GRID_ID);
      expect(event.payload.property).toBe('theme');
      expect(event.payload.oldValue).toBe('light');
      expect(event.payload.newValue).toBe('dark');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should be part of GridEventType union', () => {
      const event: GridEventType = createGridStateChangeEvent();
      expect(event.type).toBe('grid:state-change');
    });
  });

  describe('Grid Event Type Safety', () => {
    it('should enforce correct payload types', () => {
      const event = {
        type: 'grid:init',
        payload: {
          gridId: TEST_GRID_ID,
          config: { theme: 'default' },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      } as GridInitEvent;
      
      // This test ensures that the payload has the correct type
      expect(typeof event.payload.gridId).toBe('string');
      expect(typeof event.payload.timestamp).toBe('number');
      expect(event.payload.config).toBeDefined();
    });

    it('should enforce event type string validation', () => {
      const event = {
        type: 'grid:init' as const,
        payload: {
          gridId: TEST_GRID_ID,
          config: { theme: 'default' },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      } as const;
      
      // This test ensures that the event type is a valid string literal
      expect(event.type).toBe('grid:init');
    });
  });
});