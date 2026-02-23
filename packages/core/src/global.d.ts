// Global type definitions for GridKit Core
export {};

// Add missing DOM APIs for Node.js environment
declare global {
  interface IdleDeadline {
    readonly didTimeout: boolean;
    timeRemaining(): number;
  }

  interface Window {
    requestIdleCallback?(callback: (deadline: IdleDeadline) => void, options?: { timeout: number }): number;
    cancelIdleCallback?(handle: number): void;
  }

  // Fallback for environments without requestIdleCallback
  function requestIdleCallback(callback: (deadline: IdleDeadline) => void, options?: { timeout: number }): number;
  function cancelIdleCallback(handle: number): void;

  // Make globalThis available
  var globalThis: typeof globalThis;

  // Types for WeakRef and FinalizationRegistry (ES2024, included via DOM lib in build)
  // Define them here to avoid issues with isolatedModules
  type WeakRef<T extends object = object> = {
    deref(): T | undefined;
  };

  class FinalizationRegistry<T> {
    constructor(callback: (heldValue: T) => void);
    register(target: object, heldValue: T, unregisterToken?: object): void;
    unregister(token: object): void;
  }
}