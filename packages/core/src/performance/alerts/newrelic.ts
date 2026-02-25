/**
 * New Relic Alert Destination.
 *
 * Sends budget violations to New Relic monitoring.
 *
 * @module @gridkit/core/performance/alerts/newrelic
 */

import { BaseAlertDestination } from './index';
import type { BudgetViolation, AlertDestinationType } from '../types/metrics';

/**
 * New Relic alert destination configuration.
 */
export interface NewRelicOptions extends Record<string, unknown> {
  /** New Relic API key */
  apiKey?: string;
  /** New Relic license key */
  licenseKey?: string;
  /** New Relic app name */
  appName?: string;
}

/**
 * New Relic alert destination implementation.
 */
export class NewRelicAlertDestination extends BaseAlertDestination {
  id = 'newrelic';
  type = 'newrelic' as const;

  private options: NewRelicOptions;

  constructor(options: NewRelicOptions = {}) {
    super();
    this.options = options;
  }

  async send(violation: BudgetViolation): Promise<void> {
    try {
      // Simulate New Relic integration
      console.log('[New Relic] Would send performance event:', {
        eventType: 'PerformanceBudgetViolation',
        operation: violation.operation,
        actual: violation.actual,
        budget: violation.budget,
        severity: violation.severity,
        impact: violation.impact,
        percentageOver: violation.percentageOver,
        timestamp: violation.timestamp,
        ...this.options,
      });

      // Uncomment in production with New Relic SDK
      // if (typeof NR_agent !== 'undefined' && NR_agent.addPageAction) {
      //   NR_agent.addPageAction('BudgetViolation', {
      //     operation: violation.operation,
      //     actual: violation.actual,
      //     budget: violation.budget,
      //   });
      // }
    } catch (error) {
      console.error('Failed to send New Relic alert:', error);
    }
  }

  getConfig(): Record<string, unknown> {
    return this.options;
  }
}

/**
 * Create a New Relic alert destination.
 */
export function createNewRelicAlertDestination(options: NewRelicOptions = {}): NewRelicAlertDestination {
  return new NewRelicAlertDestination(options);
}
