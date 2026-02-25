/**
 * DataDog Alert Destination.
 *
 * Sends budget violations to DataDog monitoring.
 *
 * @module @gridkit/core/performance/alerts/datadog
 */

import { BaseAlertDestination } from './index';
import type { BudgetViolation, AlertDestinationType } from '../types/metrics';

/**
 * DataDog alert destination configuration.
 */
export interface DataDogOptions extends Record<string, unknown> {
  /** DataDog API key */
  apiKey?: string;
  /** DataDog site */
  site?: string;
  /** Custom tags */
  tags?: Record<string, string>;
}

/**
 * DataDog alert destination implementation.
 */
export class DataDogAlertDestination extends BaseAlertDestination {
  id = 'datadog';
  type = 'datadog' as const;

  private options: DataDogOptions;

  constructor(options: DataDogOptions = {}) {
    super();
    this.options = options;
  }

  async send(violation: BudgetViolation): Promise<void> {
    try {
      // Simulate DataDog integration
      console.log('[DataDog] Would send performance metric:', {
        metric: 'gridkit.performance.budget_violation',
        points: violation.actual,
        tags: [
          `operation:${violation.operation}`,
          `severity:${violation.severity}`,
          `impact:${violation.impact}`,
          ...(this.options.tags ? Object.entries(this.options.tags).map(([k, v]) => `${k}:${v}`) : []),
        ],
        type: 'gauge',
        ...this.options,
      });

      // Uncomment in production with DataDog SDK
      // if (typeof dd_metrics !== 'undefined') {
      //   dd_metrics.gauge('gridkit.performance.budget_violation', violation.actual, {
      //     tags: [
      //       `operation:${violation.operation}`,
      //       `severity:${violation.severity}`,
      //       `impact:${violation.impact}`,
      //     ],
      //   });
      // }
    } catch (error) {
      console.error('Failed to send DataDog alert:', error);
    }
  }

  getConfig(): Record<string, unknown> {
    return this.options;
  }
}

/**
 * Create a DataDog alert destination.
 */
export function createDataDogAlertDestination(options: DataDogOptions = {}): DataDogAlertDestination {
  return new DataDogAlertDestination(options);
}
