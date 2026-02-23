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

// Enhanced plugin types
export type {
  EnhancedPlugin,
  EnhancedPluginMetadata,
  PluginCategory,
  PluginPricing,
  ResourceLimits,
  Permission,
  PluginHealth,
  PluginValidationResult,
  ResourceUsage,
  PluginUpdate,
  PluginSearchQuery,
  PluginSearchResult,
  PluginAnalytics,
  PluginStorage,
  PluginMessage,
  MarketplaceConfig,
  PublishMetadata,
  HotReloadConfig,
  PluginError,
  PluginNotFoundError,
  PluginValidationError,
  PluginDependencyError,
  PluginHealthCheckError,
  PluginMarketplaceError,
  HotReloadError,
} from './types/enhanced';

// Plugin isolation exports
export { EventSandbox } from './isolation/EventSandbox';

// Plugin event forwarding exports
export { PluginEventForwarder } from './core/PluginEventForwarder';
export type { PluginEventForwarder as IPluginEventForwarder } from './core/PluginEventForwarder';

// Cross-plugin communication exports
export { CrossPluginBridge } from './core/CrossPluginBridge';
export type { CrossPluginBridge as ICrossPluginBridge } from './core/CrossPluginBridge';

// Enhanced plugin context
export { EnhancedPluginContext, PluginContextFactory } from './context/EnhancedPluginContext';

// Plugin lifecycle exports
export { initializePlugin, initializePlugins, PluginInitializationError } from './lifecycle/index';
export { destroyPlugin, destroyPlugins, PluginDestructionError } from './lifecycle/index';
export type {
  InitializationOptions,
  InitializationResult,
  DestructionOptions,
  DestructionResult
} from './lifecycle/index';

// Plugin security exports
export { ErrorBoundary as PluginErrorBoundary } from './security/ErrorBoundary';

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

// Enhanced plugin manager exports
export { EnhancedPluginManager } from './manager/EnhancedPluginManager';

// Plugin marketplace exports
export { PluginMarketplace } from './marketplace/PluginMarketplace';

// Hot reload exports
export { HotReloadManager } from './hot-reload/HotReloadManager';

// Plugin config exports
export { ConfigManager } from './config/ConfigManager';
export type { ConfigSchema } from './config/ConfigSchema';
export { ConfigValidator } from './config/ConfigValidator';
export { ConfigWatcher } from './config/ConfigWatcher';
