export { DevToolsPlugin } from './devtools-plugin';
export type { DevToolsConfig } from './types/devtools-config';

// Action naming utilities
export { 
  defaultActionNaming, 
  generateActionName, 
  createActionMetadata,
  type ActionNamingStrategy,
  type ActionMetadata 
} from './utils/action-naming';

// Stack trace utilities
export { 
  captureStackTrace, 
  createStackTraceGenerator, 
  isStackTraceEnabled,
  type StackTraceConfig,
  type CapturedStackTrace 
} from './utils/stack-tracer';

// Action creator utilities
export { 
  createAction, 
  createActionGroup, 
  createActionWithNaming,
  type Action,
  type ActionGroup 
} from './utils/action-creator';

// Configuration utilities
export { 
  getDevToolsConfig, 
  updateDevToolsConfig, 
  resetDevToolsConfig,
  isDevelopmentMode,
  isActionGroupingEnabled,
  type DevToolsConfig 
} from './config/devtools-config';

/**
 * Factory function to create a DevTools plugin instance.
 * @param config Configuration options for the DevTools plugin
 * @returns A plugin function that can be applied to a store
 */
export function devTools(config: DevToolsConfig = {}): (store: any) => void {
  return (store: any) => {
    const plugin = new DevToolsPlugin(config);
    plugin.apply(store);
  };
}