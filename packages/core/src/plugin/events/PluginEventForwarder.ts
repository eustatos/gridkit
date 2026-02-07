import type { EventBus } from './PluginEventBus';
import type { GridEvent } from './PluginEvents';

/**
 * PluginEventForwarder handles controlled event forwarding between plugins
 * and between plugins and the core system.
 */
export class PluginEventForwarder {
  private sourceBus: EventBus;
  private targetBus: EventBus;
  private allowedEvents: Set<string> | null;
  private eventTransformers: Map<string, (event: GridEvent) => GridEvent>;

  /**
   * Creates a new event forwarder between two event buses.
   * @param sourceBus - The source event bus
   * @param targetBus - The target event bus
   * @param allowedEvents - Optional set of allowed event types (null for all)
   */
  constructor(
    sourceBus: EventBus,
    targetBus: EventBus,
    allowedEvents: string[] | null = null
  ) {
    this.sourceBus = sourceBus;
    this.targetBus = targetBus;
    this.allowedEvents = allowedEvents ? new Set(allowedEvents) : null;
    this.eventTransformers = new Map();

    // Set up forwarding
    this.setupForwarding();
  }

  /**
   * Adds an event transformer for a specific event type.
   * @param eventType - The event type to transform
   * @param transformer - The transformation function
   */
  public addTransformer(
    eventType: string,
    transformer: (event: GridEvent) => GridEvent
  ): void {
    this.eventTransformers.set(eventType, transformer);
  }

  /**
   * Removes an event transformer.
   * @param eventType - The event type to remove transformer for
   */
  public removeTransformer(eventType: string): void {
    this.eventTransformers.delete(eventType);
  }

  /**
   * Sets the allowed events for forwarding.
   * @param allowedEvents - Array of allowed event types (null for all)
   */
  public setAllowedEvents(allowedEvents: string[] | null): void {
    this.allowedEvents = allowedEvents ? new Set(allowedEvents) : null;
  }

  /**
   * Sets up event forwarding between the buses.
   */
  private setupForwarding(): void {
    // Forward events from source to target
    this.sourceBus.on('*', (event) => {
      if (this.isEventAllowed(event.type)) {
        const transformedEvent = this.transformEvent(event);
        this.targetBus.emit(transformedEvent.type, transformedEvent.payload);
      }
    });
  }

  /**
   * Checks if an event type is allowed for forwarding.
   * @param eventType - The event type to check
   * @returns true if the event is allowed, false otherwise
   */
  private isEventAllowed(eventType: string): boolean {
    if (this.allowedEvents === null) {
      return true; // All events allowed
    }
    return this.allowedEvents.has(eventType);
  }

  /**
   * Transforms an event using registered transformers.
   * @param event - The event to transform
   * @returns The transformed event
   */
  private transformEvent(event: GridEvent): GridEvent {
    const transformer = this.eventTransformers.get(event.type);
    if (transformer) {
      return transformer(event);
    }
    return event;
  }
}