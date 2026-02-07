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
export { createDebounceMiddleware } from './middleware/debounce';

// Utilities
export { extractNamespace } from './utils/namespace';

// Augmentation helper for custom events
export type { EventPayloadMap as ExtendEventRegistry } from './types/registry';