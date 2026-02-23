/**
 * Console Alert Destination.
 *
 * Sends budget violations to console.error().
 *
 * @module @gridkit/core/performance/alerts/console
 */

import { BaseAlertDestination } from './index';
import type { BudgetViolation, AlertDestinationType } from '../types/metrics';

/**
 * Console alert destination implementation.
 */
export class ConsoleAlertDestination extends BaseAlertDestination {
  id = 'console';
  type = 'console' as const;

  async send(violation: BudgetViolation): Promise<void> {
    const message = `[Performance Budget Violation] ${violation.operation}\n` +
      `  Actual: ${violation.actual.toFixed(2)}ms\n` +
      `  Budget: ${violation.budget.toFixed(2)}ms\n` +
      `  Severity: ${violation.severity}\n` +
      `  Impact: ${violation.impact}\n` +
      `  Time: ${new Date(violation.timestamp).toISOString()}`;

    console.error(message);
  }
}

/**
 * Create a console alert destination.
 */
export function createConsoleAlertDestination(): ConsoleAlertDestination {
  return new ConsoleAlertDestination();
}
