/**
 * Eventful Table Types.
 *
 * Re-exports from events/factory for backward compatibility.
 *
 * @module @gridkit/core/events/types/eventful-table
 */

// Re-export from factory to avoid circular dependencies
export {
  createEventfulTable,
  type EventfulTable,
} from '../factory/create-eventful-table';
