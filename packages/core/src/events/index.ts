// Types
export type {
  EventType,
  EventPayload,
  EventNamespace,
  EventMiddleware,
  EventSubscription,
} from './types';

export { EventPriority } from './types';

// Core
export {
  EventBus,
  getEventBus,
  resetEventBus,
  createEventBus,
} from './EventBus';

// Component creators
export {
  createHandlerRegistry,
  type HandlerRegistry,
  createPatternMatcher,
  type PatternMatcher,
  createHandlerProcessor,
  type HandlerProcessor,
} from './HandlerRegistry';

export {
  createMiddlewarePipeline,
  type MiddlewarePipeline,
} from './MiddlewarePipeline';

export {
  createStatsCollector,
  type StatsCollector,
  type EventBusStats,
} from './StatsCollector';

export {
  createScheduler,
  type Scheduler,
} from './Scheduler';

// Middleware
export { createSimpleBatchMiddleware as createBatchMiddleware } from './middleware/simple-batch';
export { createSimpleDebounceMiddleware as createDebounceMiddleware } from './middleware/simple-debounce';

// Utilities
export { extractNamespace } from './utils/namespace';

// Augmentation helper for custom events
export type { EventPayloadMap as ExtendEventRegistry } from './types/registry';

// Integration
export {
  createTableEventBridge,
} from './integration';
export type {
  TableEventBridge,
  DataChangeType,
} from './types/event-bridge';

// Emitters
export {
  emitStateEvents,
  detectChangedKeys,
} from './emitters';

// Eventful Table
export { createEventfulTable } from './types/eventful-table';
export type {
  EventfulTable,
} from './types/eventful-table';
