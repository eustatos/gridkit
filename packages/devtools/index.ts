// DevTools plugin for nexus-state
import type { Store } from "@nexus-state/core";

// Declare global types for Redux DevTools
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (options: { name: string }) => {
        send: (action: string, state: unknown) => void;
        subscribe: (listener: (message: unknown) => void) => void;
      };
    };
  }
}

/**
 * Configuration options for the devTools plugin.
 * @typedef {Object} DevToolsConfig
 * @property {string} [name] - The name to use for the DevTools instance (defaults to 'nexus-state')
 * @property {boolean} [enableStackTrace] - Whether to capture stack traces for actions (defaults to false)
 * @property {number} [debounceDelay] - Delay in ms for debouncing state updates (defaults to 100)
 */
type DevToolsConfig = {
  name?: string;
  enableStackTrace?: boolean;
  debounceDelay?: number;
};

/**
 * Plugin to integrate with Redux DevTools for debugging state changes.
 * @param {DevToolsConfig} [config] - Configuration options for the plugin
 * @returns {Function} A function that applies the plugin to a store
 * @example
 * const store = createStore([
 *   devTools({ name: 'My App' })
 * ]);
 */
export function devTools(config: DevToolsConfig = {}): (store: Store) => void {
  return (store: Store) => {
    // Check if Redux DevTools are available
    if (typeof window === "undefined" || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      console.warn("Redux DevTools are not available");
      return;
    }

    const { name = "nexus-state", enableStackTrace = false, debounceDelay = 100 } = config;

    // Create a connection to DevTools
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name });

    // State tracking
    let lastState: unknown = null;
    let isTracking = true;

    // Enhanced store features
    if (store.applyPlugin && store.setWithMetadata && store.serializeState) {
      // Use enhanced store features if available
      
      // Track actions with metadata
      const originalSet = store.set;
      store.set = ((atom: any, update: any) => {
        // Create action metadata
        const metadata = {
          type: 'SET',
          timestamp: Date.now(),
          source: 'Unknown', // In a real implementation, this would be determined from context
        };
        
        // Capture stack trace if enabled
        if (enableStackTrace) {
          metadata.source = 'Unknown with Stack Trace'; // Placeholder
        }
        
        // Use setWithMetadata if available
        if (store.setWithMetadata) {
          store.setWithMetadata(atom, update, metadata);
        } else {
          originalSet(atom, update);
        }
        
        // Send state update to DevTools
        if (isTracking) {
          try {
            const currentState = store.serializeState?.() || store.getState();
            if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
              lastState = currentState;
              devTools.send(`SET ${atom.toString()}`, currentState);
            }
          } catch (error) {
            console.warn("Failed to send state update to DevTools:", error);
          }
        }
      }) as any;
      
      // Track computed updates
      // This would require deeper integration with the core
    } else {
      // Fallback to polling approach for basic stores
      const interval = setInterval(() => {
        try {
          const currentState = store.getState();
          if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
            lastState = currentState;
            devTools.send("STATE_UPDATE", currentState);
          }
        } catch (error) {
          console.warn("Failed to send state update to DevTools:", error);
        }
      }, debounceDelay);

      // Clean up interval when window is unloaded
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", () => {
          clearInterval(interval);
        });
      }
    }

    // Send initial state
    setTimeout(() => {
      try {
        const state = store.serializeState?.() || store.getState();
        lastState = state;
        devTools.send("INITIAL_STATE", state);
      } catch (error) {
        console.warn("Failed to send initial state to DevTools:", error);
      }
    }, 0);

    // Handle actions from DevTools (e.g., time travel)
    devTools.subscribe((message: unknown) => {
      if (
        typeof message === "object" &&
        message !== null &&
        (message as { type?: string }).type === "DISPATCH" &&
        (message as { payload?: { type?: string } }).payload?.type === "JUMP_TO_ACTION"
      ) {
        // Logic for state restoration should be implemented here
        // Since we don't have direct access to the internal state of atoms,
        // we cannot fully implement time travel without core modifications
        console.warn(
          "Time travel is not fully supported without core modifications",
        );
      }
      
      // Handle pause/resume
      if (
        typeof message === "object" &&
        message !== null &&
        (message as { type?: string }).type === "DISPATCH" &&
        (message as { payload?: { type?: string } }).payload?.type === "START"
      ) {
        isTracking = true;
      }
      
      if (
        typeof message === "object" &&
        message !== null &&
        (message as { type?: string }).type === "DISPATCH" &&
        (message as { payload?: { type?: string } }).payload?.type === "STOP"
      ) {
        isTracking = false;
      }
    });
  };
}