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
} from './integration';

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
