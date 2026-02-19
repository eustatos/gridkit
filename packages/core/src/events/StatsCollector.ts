/**
 * Statistics collector for event bus metrics
 * 
 * Single Responsibility: Collect and report event bus performance metrics
 */
export interface StatsCollector {
  incrementTotalEvents(): void;
  incrementTotalHandlers(): void;
  decrementTotalHandlers(): void;
  incrementEventCount(event: string): void;
  recordExecutionTime(event: string, executionTime: number): void;
  getStats(): Readonly<EventBusStats>;
  clear(): void;
  getTotalEvents(): number;
  getTotalHandlers(): number;
  getEventCount(event: string): number;
}

/**
 * Optimized event bus statistics interface
 */
export interface EventBusStats {
  totalEvents: number;
  totalHandlers: number;
  eventCounts: Map<string, number>;
  avgExecutionTime: Map<string, number>;
}

/**
 * Create statistics collector for event bus metrics
 */
export function createStatsCollector(): StatsCollector {
  let totalEvents = 0;
  let totalHandlers = 0;
  const eventCounts = new Map<string, number>();
  const avgExecutionTime = new Map<string, number>();

  return {
    incrementTotalEvents(): void {
      totalEvents++;
    },

    incrementTotalHandlers(): void {
      totalHandlers++;
    },

    decrementTotalHandlers(): void {
      if (totalHandlers > 0) {
        totalHandlers--;
      }
    },

    incrementEventCount(event: string): void {
      const count = eventCounts.get(event) || 0;
      eventCounts.set(event, count + 1);
    },

    recordExecutionTime(event: string, executionTime: number): void {
      const avgTime = avgExecutionTime.get(event) ?? 0;
      const count = eventCounts.get(event) ?? 1;
      avgExecutionTime.set(
        event,
        (avgTime * (count - 1) + executionTime) / count
      );
    },

    getStats(): Readonly<EventBusStats> {
      return {
        totalEvents,
        totalHandlers,
        eventCounts: new Map(eventCounts),
        avgExecutionTime: new Map(avgExecutionTime),
      };
    },

    clear(): void {
      totalEvents = 0;
      totalHandlers = 0;
      eventCounts.clear();
      avgExecutionTime.clear();
    },

    getTotalEvents(): number {
      return totalEvents;
    },

    getTotalHandlers(): number {
      return totalHandlers;
    },

    getEventCount(event: string): number {
      return eventCounts.get(event) || 0;
    },
  };
}
