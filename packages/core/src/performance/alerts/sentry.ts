/**
 * Sentry Alert Destination.
 *
 * Sends budget violations to Sentry error tracking.
 *
 * @module @gridkit/core/performance/alerts/sentry
 */

import { BaseAlertDestination } from './index';
import type { BudgetViolation, AlertDestinationType } from '../types/metrics';

/**
 * Sentry alert destination configuration.
 */
export interface SentryOptions extends Record<string, unknown> {
  /** Sentry DSN */
  dsn?: string;
  /** Environment name */
  environment?: string;
  /** Release version */
  release?: string;
}

/**
 * Sentry alert destination implementation.
 */
export class SentryAlertDestination extends BaseAlertDestination {
  id = 'sentry';
  type = 'sentry' as const;

  private options: SentryOptions;

  constructor(options: SentryOptions = {}) {
    super();
    this.options = options;
  }

  async send(violation: BudgetViolation): Promise<void> {
    try {
      // Simulate Sentry integration
      // In production, you would use @sentry/browser or @sentry/node
      console.log('[Sentry] Would capture performance budget violation:', {
        message: `Performance budget violated: ${violation.operation}`,
        level: violation.severity === 'critical' ? 'error' : 'warning',
        tags: {
          operation: violation.operation,
          impact: violation.impact,
          severity: violation.severity,
        },
        extra: {
          actual: violation.actual,
          budget: violation.budget,
          percentageOver: violation.percentageOver,
          timestamp: violation.timestamp,
        },
        ...this.options,
      });

      // Uncomment in production with Sentry SDK
      // if (typeof Sentry !== 'undefined' && Sentry.captureMessage) {
      //   Sentry.captureMessage('Performance budget violation', {
      //     level: violation.severity === 'critical' ? 'error' : 'warning',
      //     tags: {
      //       operation: violation.operation,
      //       impact: violation.impact,
      //     },
      //     extra: violation,
      //   });
      // }
    } catch (error) {
      console.error('Failed to send Sentry alert:', error);
    }
  }

  getConfig(): Record<string, unknown> {
    return this.options;
  }
}

/**
 * Create a Sentry alert destination.
 */
export function createSentryAlertDestination(options: SentryOptions = {}): SentryAlertDestination {
  return new SentryAlertDestination(options);
}
