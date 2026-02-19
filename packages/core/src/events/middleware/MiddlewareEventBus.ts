// MiddlewareEventBus.ts

import type { GridEvent, EventMiddleware } from '../types';

import { EventPipeline } from './core/EventPipeline';

/**
 * Event bus with middleware support
 * 
 * Features:
 * - Middleware pipeline processing
 * - Simple event emission
 * - Dynamic middleware management
 */
export class MiddlewareEventBus {
  private pipeline: EventPipeline;
  private listeners: Array<(event: GridEvent) => void> = [];

  constructor() {
    this.pipeline = new EventPipeline();
  }

  /**
   * Add middleware to the pipeline
   * 
   * @param middleware - Middleware function to add
   * @returns Function to remove the middleware
   */
  use(middleware: EventMiddleware): () => void {
    return this.pipeline.use(middleware);
  }

  /**
   * Emit an event through the middleware pipeline
   * 
   * @param event - Event to emit
   */
  emit(event: GridEvent): void {
    const processedEvent = this.pipeline.process(event);
    
    // If event wasn't cancelled by middleware, notify listeners
    if (processedEvent !== null) {
      // Log for debugging (as in the test)
      console.log('Event processed:', processedEvent);
      
      // Notify listeners
      for (const listener of this.listeners) {
        try {
          listener(processedEvent);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    }
  }

  /**
   * Add event listener
   * 
   * @param listener - Listener function to add
   * @returns Function to remove the listener
   */
  on(listener: (event: GridEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}