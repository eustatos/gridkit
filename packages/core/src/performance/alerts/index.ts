/**
 * Alert Destinations for Performance Monitoring.
 *
 * Implementations for sending budget violations to various monitoring services.
 *
 * @module @gridkit/core/performance/alerts
 */

// Export base classes first to avoid circular dependencies
export { BaseAlertDestination } from './base';

// Export alert destinations
export { ConsoleAlertDestination, createConsoleAlertDestination } from './console';
export { SentryAlertDestination, createSentryAlertDestination } from './sentry';
export { DataDogAlertDestination, createDataDogAlertDestination } from './datadog';
export { NewRelicAlertDestination, createNewRelicAlertDestination } from './newrelic';
