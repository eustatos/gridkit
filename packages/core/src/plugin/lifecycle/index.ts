// Lifecycle exports
export type {
  InitializationOptions,
  InitializationResult
} from './Initializer';
export { initializePlugin, initializePlugins, PluginInitializationError } from './Initializer';
export type {
  DestructionOptions,
  DestructionResult
} from './Destroyer';
export { destroyPlugin, destroyPlugins, PluginDestructionError } from './Destroyer';
