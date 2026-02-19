import { EventPriority } from './types/base';

/**
 * Scheduler for managing event processing priority and timing
 * 
 * Single Responsibility: Schedule and batch event processing
 */
export interface Scheduler {
  schedule(task: () => void, priority: EventPriority): void;
  process(): void;
  clear(): void;
  size(): number;
  isEmpty(): boolean;
}

/**
 * Create scheduler for event processing
 */
export function createScheduler(): Scheduler {
  // Use a priority queue implementation
  const queues = new Map<EventPriority, (() => void)[]>([
    [EventPriority.IMMEDIATE, []],
    [EventPriority.HIGH, []],
    [EventPriority.NORMAL, []],
    [EventPriority.LOW, []],
  ]);

  let scheduledFlush = false;
  let flushScheduled = false;

  /**
   * Get tasks in priority order
   */
  function getTasksInPriorityOrder(): (() => void)[] {
    const allTasks: (() => void)[] = [];
    const priorityOrder: EventPriority[] = [
      EventPriority.IMMEDIATE,
      EventPriority.HIGH,
      EventPriority.NORMAL,
      EventPriority.LOW,
    ];

    for (const priority of priorityOrder) {
      const queue = queues.get(priority);
      if (queue && queue.length > 0) {
        allTasks.push(...queue);
      }
    }

    return allTasks;
  }

  /**
   * Schedule a task with the given priority
   */
  function schedule(task: () => void, priority: EventPriority): void {
    const queue = queues.get(priority);
    if (!queue) {
      throw new Error(`Invalid priority: ${priority}`);
    }
    queue.push(task);

    if (!flushScheduled) {
      flushScheduled = true;
      scheduleProcessing();
    }
  }

  /**
   * Schedule processing using the most efficient method available
   */
  function scheduleProcessing(): void {
    if (scheduledFlush) return;

    scheduledFlush = true;

    // Use the most efficient scheduling available
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => processQueue());
    } else if (typeof setImmediate !== 'undefined') {
      setImmediate(() => processQueue());
    } else {
      setTimeout(() => processQueue(), 0);
    }
  }

  /**
   * Process the queue
   */
  function processQueue(): void {
    // Note: don't reset scheduledFlush here - it's managed by scheduleProcessing()
    flushScheduled = false;

    try {
      process();
    } finally {
      // Check if more events were added during processing
      let hasTasks = false;
      const priorityOrder: EventPriority[] = [
        EventPriority.IMMEDIATE,
        EventPriority.HIGH,
        EventPriority.NORMAL,
        EventPriority.LOW,
      ];

      for (const priority of priorityOrder) {
        const queue = queues.get(priority);
        if (queue && queue.length > 0) {
          hasTasks = true;
          break;
        }
      }

      if (hasTasks) {
        flushScheduled = true;
        scheduleProcessing();
      }
    }
  }

  /**
   * Process all queued tasks
   */
  function process(): void {
    const tasksToProcess = getTasksInPriorityOrder();

    // Clear queues BEFORE executing tasks to prevent re-processing
    for (const priority of [EventPriority.IMMEDIATE, EventPriority.HIGH, EventPriority.NORMAL, EventPriority.LOW]) {
      const queue = queues.get(priority);
      if (queue) {
        queue.length = 0;
      }
    }

    // Execute all tasks
    for (const task of tasksToProcess) {
      try {
        task();
      } catch (error) {
        console.error('Error processing scheduled task:', error);
      }
    }
  }

  return {
    schedule,
    process,
    clear(): void {
      for (const priority of [EventPriority.IMMEDIATE, EventPriority.HIGH, EventPriority.NORMAL, EventPriority.LOW]) {
        const queue = queues.get(priority);
        if (queue) {
          queue.length = 0;
        }
      }
      scheduledFlush = false;
      flushScheduled = false;
    },

    size(): number {
      let total = 0;
      const priorityOrder: EventPriority[] = [
        EventPriority.IMMEDIATE,
        EventPriority.HIGH,
        EventPriority.NORMAL,
        EventPriority.LOW,
      ];

      for (const priority of priorityOrder) {
        const queue = queues.get(priority);
        if (queue) {
          total += queue.length;
        }
      }
      return total;
    },

    isEmpty(): boolean {
      return this.size() === 0;
    },
  };
}
