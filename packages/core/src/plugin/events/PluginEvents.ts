// PluginEvents.ts - Re-export types from events to avoid breaking changes
// This file is kept for backward compatibility during migration

export type { GridEvent, EventType, EventPayload, EventHandler, EventMiddleware, EventHandlerOptions } from '../../events/types';
export { EventPriority } from '../../events/types';
