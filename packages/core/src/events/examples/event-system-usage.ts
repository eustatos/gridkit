/**
 * Event System Usage Examples
 * 
 * This file demonstrates how to use the GridKit Event System
 * in various scenarios.
 */

import {
  getEventBus,
  createEventBus,
  createBatchMiddleware,
  createDebounceMiddleware,
  EventPriority
} from '../index';

// For demonstration purposes, we'll create mock branded types
// In a real implementation, these would come from the type system
const createRowId = (id: string) => id as any;
const createColumnId = (id: string) => id as any;
const createGridId = (id: string) => id as any;
const createCellId = (id: string) => id as any;

// Example 1: Basic Usage
function basicUsageExample() {
  console.log('=== Basic Usage Example ===');
  
  // Get the global event bus
  const bus = getEventBus();
  
  // Subscribe to row add events
  const unsubscribe = bus.on('row:add', (event) => {
    console.log(`Row added: ${event.payload.rowId} at index ${event.payload.index}`);
  });
  
  // Emit a row add event
  bus.emit('row:add', {
    rowId: createRowId('row-1'),
    index: 0,
    isNew: true
  });
  
  // Unsubscribe when done
  unsubscribe();
  
  console.log('Basic usage example completed');
}

// Example 2: Priority-Based Handling
function priorityExample() {
  console.log('=== Priority-Based Handling Example ===');
  
  const bus = createEventBus();
  const executionOrder: string[] = [];
  
  // Subscribe with different priorities
  bus.on('grid:init', () => {
    executionOrder.push('LOW');
  }, { priority: EventPriority.LOW });
  
  bus.on('grid:init', () => {
    executionOrder.push('NORMAL');
  }, { priority: EventPriority.NORMAL });
  
  bus.on('grid:init', () => {
    executionOrder.push('HIGH');
  }, { priority: EventPriority.HIGH });
  
  bus.on('grid:init', () => {
    executionOrder.push('IMMEDIATE');
  }, { priority: EventPriority.IMMEDIATE });
  
  // Emit event
  bus.emit('grid:init', { gridId: createGridId('test-grid') });
  
  // Wait for processing
  setTimeout(() => {
    console.log('Execution order:', executionOrder);
    console.log('Priority example completed');
  }, 10);
}

// Example 3: Middleware Usage
function middlewareExample() {
  console.log('=== Middleware Usage Example ===');
  
  const bus = createEventBus();
  
  // Create and apply batch middleware
  const batchMiddleware = createBatchMiddleware({
    window: 50,
    maxSize: 5
  });
  bus.use(batchMiddleware);
  
  // Create and apply debounce middleware
  const debounceMiddleware = createDebounceMiddleware(100);
  bus.use(debounceMiddleware);
  
  // Subscribe to events
  bus.on('data:load', (event) => {
    console.log(`Data loaded: ${event.payload.data.length} items`);
  });
  
  // Emit multiple events that will be batched
  for (let i = 0; i < 3; i++) {
    bus.emit('data:load', {
      data: Array(10).fill(0).map((_, idx) => `item-${i}-${idx}`),
      source: 'manual'
    });
  }
  
  console.log('Middleware example completed (check console for batched output)');
}

// Example 4: Custom Events
function customEventsExample() {
  console.log('=== Custom Events Example ===');
  
  // In a real implementation, you would extend the EventRegistry type:
  /*
  declare module '../types' {
    interface EventRegistry {
      'custom:my-event': {
        message: string;
        timestamp: number;
      };
    }
  }
  */
  
  const bus = getEventBus();
  
  // Subscribe to custom event (using any for demonstration)
  bus.on('custom:my-event' as any, (event: any) => {
    console.log(`Custom event received: ${event.payload.message}`);
  });
  
  // Emit custom event
  bus.emit('custom:my-event' as any, {
    message: 'Hello from custom event!',
    timestamp: Date.now()
  });
  
  console.log('Custom events example completed');
}

// Example 5: Error Handling
function errorHandlingExample() {
  console.log('=== Error Handling Example ===');
  
  const bus = createEventBus();
  
  // Subscribe with error-prone handler
  bus.on('row:update' as any, (event: any) => {
    console.log(`Updating row: ${event.payload.rowId}`);
    // Simulate an error
    throw new Error('Simulated error in event handler');
  });
  
  // Subscribe with async handler
  bus.on('column:resize' as any, async (event: any) => {
    console.log(`Resizing column: ${event.payload.columnId}`);
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log('Column resize completed');
    } catch (error) {
      console.error('Async error in event handler:', error);
    }
  });
  
  // Emit events
  bus.emit('row:update' as any, {
    rowId: createRowId('row-1'),
    changes: { name: 'New Name' },
    isDirty: true
  });
  
  bus.emit('column:resize' as any, {
    columnId: createColumnId('col-1'),
    width: 200,
    oldWidth: 150
  });
  
  console.log('Error handling example completed');
}

// Example 6: Memory Management
function memoryManagementExample() {
  console.log('=== Memory Management Example ===');
  
  const bus = createEventBus();
  
  // Add many handlers
  const unsubscribes: Array<() => void> = [];
  
  for (let i = 0; i < 100; i++) {
    const unsubscribe = bus.on('grid:init' as any, () => {
      // Handler logic
    });
    unsubscribes.push(unsubscribe);
  }
  
  console.log(`Handlers before cleanup: ${bus.getStats().totalHandlers}`);
  
  // Unsubscribe half of them
  for (let i = 0; i < 50; i++) {
    unsubscribes[i]();
  }
  
  console.log(`Handlers after partial cleanup: ${bus.getStats().totalHandlers}`);
  
  // Clear all remaining handlers
  bus.clear();
  
  console.log(`Handlers after full cleanup: ${bus.getStats().totalHandlers}`);
  
  console.log('Memory management example completed');
}

// Run all examples
function runAllExamples() {
  console.log('GridKit Event System Usage Examples');
  
  basicUsageExample();
  priorityExample();
  middlewareExample();
  customEventsExample();
  errorHandlingExample();
  memoryManagementExample();
  
  console.log('All examples completed!');
}

// Export for testing or further usage
export {
  basicUsageExample,
  priorityExample,
  middlewareExample,
  customEventsExample,
  errorHandlingExample,
  memoryManagementExample,
  runAllExamples
};

// Run if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllExamples();
}