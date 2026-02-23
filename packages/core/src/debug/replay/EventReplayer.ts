/**
 * Event replay manager for GridKit.
 * Enables event replay for debugging and time-travel functionality.
 * 
 * @module @gridkit/core/debug/replay
 */

import type { GridEvent } from '../../events/types/base';
import type { EventBus } from '../../events/EventBus';
import type { Store } from '../../state/types';
import type { ReplayOptions } from '@/debug/types';

/**
 * Event replayer for debugging and time-travel
 */
export class EventReplayer {
  private isReplaying = false;
  private replaySpeed = 1;
  private pauseOnError = false;
  private skipValidation = false;
  private emitEvents = true;

  constructor(
    private eventBus: EventBus,
    private stateManager: Store<any>
  ) {}

  /**
   * Replay a single event
   */
  replayEvent(event: GridEvent, options?: ReplayOptions): void {
    this.applyOptions(options);

    if (!this.emitEvents) {
      return;
    }

    try {
      if (!this.skipValidation) {
        this.validateEvent(event);
      }
      this.eventBus.emit(event.type, event.payload);
    } catch (error) {
      if (this.pauseOnError) {
        this.isReplaying = false;
      }
      throw error;
    }
  }

  /**
   * Replay multiple events
   */
  replayEvents(events: GridEvent[], options?: ReplayOptions & { onStart?: () => void; onComplete?: () => void }): void {
    this.applyOptions(options);

    if (events.length === 0) {
      options?.onComplete?.();
      return;
    }

    this.isReplaying = true;
    let currentIndex = 0;

    const interval = Math.max(10, 100 / this.replaySpeed);

    const replayInterval = setInterval(() => {
      if (!this.isReplaying || currentIndex >= events.length) {
        clearInterval(replayInterval);
        this.isReplaying = false;
        options?.onComplete?.();
        return;
      }

      try {
        this.replayEvent(events[currentIndex]);
        currentIndex++;
      } catch (error) {
        clearInterval(replayInterval);
        this.isReplaying = false;
        throw error;
      }
    }, interval);

    options?.onStart?.();
  }

  /**
   * Replay events from event store
   */
  replayFromStore(from: number, to: number, options?: ReplayOptions): void {
    const events = this.getEventsInRange(from, to);
    this.replayEvents(events, options);
  }

  /**
   * Replay with speed control
   */
  replayWithSpeed(events: GridEvent[], speed: number, options?: ReplayOptions): void {
    this.replayEvents(events, { ...options, speed });
  }

  /**
   * Start replay
   */
  start(): void {
    this.isReplaying = true;
  }

  /**
   * Pause replay
   */
  pause(): void {
    this.isReplaying = false;
  }

  /**
   * Resume replay
   */
  resume(): void {
    this.isReplaying = true;
  }

  /**
   * Stop replay
   */
  stop(): void {
    this.isReplaying = false;
  }

  /**
   * Check if replaying
   */
  isPlaying(): boolean {
    return this.isReplaying;
  }

  /**
   * Apply replay options
   */
  private applyOptions(options?: ReplayOptions): void {
    if (options?.speed !== undefined) {
      this.replaySpeed = options.speed;
    }
    if (options?.pauseOnError !== undefined) {
      this.pauseOnError = options.pauseOnError;
    }
    if (options?.skipValidation !== undefined) {
      this.skipValidation = options.skipValidation;
    }
    if (options?.emitEvents !== undefined) {
      this.emitEvents = options.emitEvents;
    }
  }

  /**
   * Validate event before replay
   */
  private validateEvent(event: GridEvent): void {
    if (!event.type) {
      throw new Error('Event must have a type');
    }
    if (!event.payload) {
      throw new Error('Event must have a payload');
    }
  }

  /**
   * Get events in range
   */
  private getEventsInRange(from: number, to: number): GridEvent[] {
    // Placeholder - would retrieve from event store
    return [];
  }

  /**
   * Get current replay state
   */
  getState(): {
    isReplaying: boolean;
    speed: number;
    pauseOnError: boolean;
    skipValidation: boolean;
    emitEvents: boolean;
  } {
    return {
      isReplaying: this.isReplaying,
      speed: this.replaySpeed,
      pauseOnError: this.pauseOnError,
      skipValidation: this.skipValidation,
      emitEvents: this.emitEvents,
    };
  }
}
