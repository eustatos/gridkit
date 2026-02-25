/**
 * Performance Budget Presets.
 *
 * Ready-to-use budget configurations for different use cases.
 *
 * @module @gridkit/core/performance/budgets/presets
 */

import type { PerformanceBudget, PerformanceReportOptions, PerformanceReportSummary } from '../types/metrics';

/**
 * Frame budget for 60fps (16ms per frame).
 */
export const FRAME_BUDGET = 16;

/**
 * Interactive operation budgets (user-facing operations).
 */
export const INTERACTIVE_BUDGETS = {
  rowModelBuild: 16, // 1 frame @ 60fps
  sorting: 50,
  filtering: 100,
  pagination: 10,
  selection: 5,
  columnResize: 16,
  columnReorder: 16,
  groupBy: 100,
} as const;

/**
 * Rendering budgets (UI rendering operations).
 */
export const RENDERING_BUDGETS = {
  cellRender: 1,
  rowRender: 5,
  tableRender: 100,
  headerRender: 10,
  footerRender: 10,
  virtualScroll: 16,
} as const;

/**
 * Background operation budgets (non-UI operations).
 */
export const BACKGROUND_BUDGETS = {
  dataFetch: 1000,
  stateSync: 100,
  cacheUpdate: 50,
  export: 2000,
  print: 5000,
} as const;

/**
 * Strict budgets for performance-critical applications.
 */
export const STRICT_BUDGETS = {
  ...INTERACTIVE_BUDGETS,
  ...RENDERING_BUDGETS,
  dataFetch: 500,
  stateSync: 50,
  cacheUpdate: 25,
} as const;

/**
 * Relaxed budgets for less performance-critical applications.
 */
export const RELAXED_BUDGETS = {
  ...INTERACTIVE_BUDGETS,
  ...RENDERING_BUDGETS,
  dataFetch: 2000,
  stateSync: 200,
  cacheUpdate: 100,
} as const;

/**
 * Default budgets (normal usage).
 */
export const DEFAULT_BUDGETS = {
  ...INTERACTIVE_BUDGETS,
  ...RENDERING_BUDGETS,
  dataFetch: 1000,
  stateSync: 100,
  cacheUpdate: 50,
} as const;

/**
 * Create performance budgets with specified severity.
 */
export function createBudgets(
  budgets: Record<string, number>,
  severity: 'warning' | 'error' | 'critical' = 'error'
): PerformanceBudget[] {
  return Object.entries(budgets).map(([operation, budgetMs]) => ({
    operation,
    budgetMs,
    enabled: true,
    severity,
  }));
}

/**
 * Create a budget preset by type.
 */
export function createBudgetPreset(
  type: 'strict' | 'normal' | 'relaxed' = 'normal'
): PerformanceBudget[] {
  const budgets = {
    strict: STRICT_BUDGETS,
    normal: DEFAULT_BUDGETS,
    relaxed: RELAXED_BUDGETS,
  }[type];

  return createBudgets(budgets);
}

/**
 * Create custom budgets with specific configuration.
 */
export function createCustomBudgets(
  budgets: Record<string, number>,
  options: {
    severity?: 'warning' | 'error' | 'critical';
    enabled?: boolean;
  } = {}
): PerformanceBudget[] {
  const { severity = 'error', enabled = true } = options;

  return Object.entries(budgets).map(([operation, budgetMs]) => ({
    operation,
    budgetMs,
    enabled,
    severity,
  }));
}
