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

// Plugin isolation exports
export { EventSandbox } from './isolation/EventSandbox';

// Plugin event forwarding exports
export { PluginEventForwarder } from './core/PluginEventForwarder';
export type { PluginEventForwarder as IPluginEventForwarder } from './core/PluginEventForwarder';

// Cross-plugin communication exports
export { CrossPluginBridge } from './core/CrossPluginBridge';
export type { CrossPluginBridge as ICrossPluginBridge } from './core/CrossPluginBridge';

// Plugin lifecycle exports
export type {
  Initializer,
  InitializerOptions,
  Destroyer,
  DestroyerOptions
} from './lifecycle';

// Plugin error boundary exports
export { ErrorBoundary } from './security/ErrorBoundary';

// Plugin quota manager exports
export { QuotaManager } from './isolation/QuotaManager';

// Plugin permission manager exports
export { PermissionManager } from './isolation/PermissionManager';

// Plugin resource monitor exports
export { ResourceMonitor } from './security/ResourceMonitor';

// Plugin event validator exports
export { EventValidator } from './security/EventValidator';

// Configurable plugin exports
export { ConfigurablePlugin } from './ConfigurablePlugin';

// Plugin config exports
export { ConfigManager } from './config/ConfigManager';
export type { ConfigSchema } from './config/ConfigSchema';
export { ConfigValidator } from './config/ConfigValidator';
export { ConfigWatcher } from './config/ConfigWatcher';
