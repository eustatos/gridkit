/**
 * Alert Destinations for Performance Monitoring.
 *
 * Implementations for sending budget violations to various monitoring services.
 *
 * @module @gridkit/core/performance/alerts
 */

import type { BudgetViolation, AlertDestination, AlertDestinationType } from '../types/metrics';

/**
 * Base class for alert destinations.
 */
export abstract class BaseAlertDestination implements AlertDestination {
  abstract id: string;
  abstract type: AlertDestinationType;

  abstract send(violation: BudgetViolation): Promise<void>;

  getConfig?(): Record<string, unknown> {
    return {};
  }
}
