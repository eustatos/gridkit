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
}