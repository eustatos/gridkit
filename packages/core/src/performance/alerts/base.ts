/**
 * Base Alert Destination class.
 *
 * Abstract base class for all alert destination implementations.
 *
 * @module @gridkit/core/performance/alerts/base
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
