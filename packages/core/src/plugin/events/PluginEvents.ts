import type { GridEvent } from '../../events/types/base';
import type { PluginMetadata } from '../core/Plugin';

/**
 * Plugin registered event
 */
export interface PluginRegisteredEvent extends GridEvent<{
  pluginId: string;
  metadata: PluginMetadata;
}> {
  readonly type: 'plugin.registered';
}

/**
 * Plugin unregistered event
 */
export interface PluginUnregisteredEvent extends GridEvent<{
  pluginId: string;
}> {
  readonly type: 'plugin.unregistered';
}

/**
 * Plugin initialized event
 */
export interface PluginInitializedEvent extends GridEvent<{
  pluginId: string;
  metadata: PluginMetadata;
}> {
  readonly type: 'plugin.initialized';
}

/**
 * Plugin destroyed event
 */
export interface PluginDestroyedEvent extends GridEvent<{
  pluginId: string;
  metadata: PluginMetadata;
}> {
  readonly type: 'plugin.destroyed';
}

/**
 * Plugin updated event
 */
export interface PluginUpdatedEvent extends GridEvent<{
  pluginId: string;
  metadata: PluginMetadata;
  config: Record<string, unknown>;
}> {
  readonly type: 'plugin.updated';
}

/**
 * Plugin error event
 */
export interface PluginErrorEvent extends GridEvent<{
  pluginId: string;
  metadata: PluginMetadata;
  error: Error;
}> {
  readonly type: 'plugin.error';
}

/**
 * Union type of all plugin events
 */
export type PluginEventType = 
  | PluginRegisteredEvent
  | PluginUnregisteredEvent
  | PluginInitializedEvent
  | PluginDestroyedEvent
  | PluginUpdatedEvent
  | PluginErrorEvent;

/**
 * Type mapping for plugin event payloads
 */
export interface PluginEventPayloadMap {
  'plugin.registered': PluginRegisteredEvent['payload'];
  'plugin.unregistered': PluginUnregisteredEvent['payload'];
  'plugin.initialized': PluginInitializedEvent['payload'];
  'plugin.destroyed': PluginDestroyedEvent['payload'];
  'plugin.updated': PluginUpdatedEvent['payload'];
  'plugin.error': PluginErrorEvent['payload'];
}

/**
 * Helper type to get payload type by event type
 */
export type PluginEventPayload<T extends keyof PluginEventPayloadMap> = PluginEventPayloadMap[T];