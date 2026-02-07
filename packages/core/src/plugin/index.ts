// Core plugin system exports
export type {
  Plugin,
  PluginContext,
  PluginMetadata
} from './core/Plugin';

export type {
  PluginRegistry,
  GetPlugin,
  RegisteredPluginIds,
  PluginCapability,
  PluginConfigSchema,
  PluginConfigProperty
} from './core/PluginRegistry';

export { PluginManager } from './core/PluginManager';

// Plugin events exports
export type {
  PluginRegisteredEvent,
  PluginUnregisteredEvent,
  PluginInitializedEvent,
  PluginDestroyedEvent,
  PluginUpdatedEvent,
  PluginErrorEvent,
  PluginEventType,
  PluginEventPayloadMap,
  PluginEventPayload
} from './events/PluginEvents';

export {
  createPluginEventBus,
  getPluginEventBus,
  resetPluginEventBus
} from './events/PluginEventBus';

// Plugin isolation exports
export { EventSandbox } from './isolation/EventSandbox';

// Plugin event forwarding exports
export { PluginEventForwarder } from './events/PluginEventForwarder';

// Cross-plugin communication exports
export { CrossPluginBridge } from './events/CrossPluginBridge';

// Plugin lifecycle exports
export type {
  InitializationOptions,
  InitializationResult,
  DestructionOptions,
  DestructionResult
} from './lifecycle/Initializer';

export {
  initializePlugin,
  initializePlugins,
  PluginInitializationError
} from './lifecycle/Initializer';

export {
  destroyPlugin,
  destroyPlugins,
  PluginDestructionError
} from './lifecycle/Destroyer';