export { DevToolsPlugin } from './devtools-plugin';
export type { DevToolsConfig } from './types/devtools-config';

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