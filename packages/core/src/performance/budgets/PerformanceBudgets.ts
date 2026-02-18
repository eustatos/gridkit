/**
 * Performance Budget System.
 *
 * Defines and validates performance budgets for GridKit tables.
 * Includes budget checking, violation detection, and threshold management.
 *
 * @module @gridkit/core/performance/budgets
 */

import type { PerformanceBudgets, BudgetViolation, ViolationContext } from '../types';
import { DEFAULT_BUDGETS } from '../types';

/**
 * Budget validator for performance budgets.
 */
export class BudgetValidatorImpl {
  validateBudgets(budgets: PerformanceBudgets): Error[] {
    const errors: Error[] = [];

    // Validate timing budgets
    const timingBudgets = [
      'tableCreation',
      'stateUpdate',
      'renderCycle',
      'rowModelBuild',
      'eventProcessing',
    ] as const;

    for (const budget of timingBudgets) {
      const value = budgets[budget];
      if (value !== undefined) {
        const error = this.validateOperationBudget(budget, value);
        if (error) errors.push(error);
      }
    }

    // Validate memory budgets
    if (budgets.memory) {
      const memoryErrors = this.validateMemoryBudgets(budgets.memory);
      errors.push(...memoryErrors);
    }

    // Validate custom operation budgets
    if (budgets.operations) {
      for (const [operation, budget] of Object.entries(budgets.operations)) {
        const error = this.validateOperationBudget(operation, budget);
        if (error) errors.push(error);
      }
    }

    // Validate thresholds
    if (budgets.warningThreshold !== undefined) {
      if (budgets.warningThreshold < 0 || budgets.warningThreshold > 1) {
        errors.push(new Error('warningThreshold must be between 0 and 1'));
      }
    }

    if (budgets.criticalThreshold !== undefined) {
      if (budgets.criticalThreshold < 0 || budgets.criticalThreshold > 1) {
        errors.push(new Error('criticalThreshold must be between 0 and 1'));
      }
    }

    return errors;
  }

  validateOperationBudget(operation: string, budget: number): Error | null {
    if (typeof budget !== 'number') {
      return new Error(`Budget for "${operation}" must be a number`);
    }
    if (budget <= 0) {
      return new Error(`Budget for "${operation}" must be positive`);
    }
    if (!Number.isFinite(budget)) {
      return new Error(`Budget for "${operation}" must be a finite number`);
    }
    return null;
  }

  validateMemoryBudgets(memory: any): Error[] {
    const errors: Error[] = [];

    if (memory.baseOverhead !== undefined) {
      if (typeof memory.baseOverhead !== 'number' || memory.baseOverhead <= 0) {
        errors.push(new Error('memory.baseOverhead must be a positive number'));
      }
    }

    if (memory.perRow !== undefined) {
      if (typeof memory.perRow !== 'number' || memory.perRow <= 0) {
        errors.push(new Error('memory.perRow must be a positive number'));
      }
    }

    if (memory.maxIncreasePerUpdate !== undefined) {
      if (typeof memory.maxIncreasePerUpdate !== 'number' || memory.maxIncreasePerUpdate <= 0) {
        errors.push(new Error('memory.maxIncreasePerUpdate must be a positive number'));
      }
    }

    if (memory.leakThreshold !== undefined) {
      if (typeof memory.leakThreshold !== 'number' || memory.leakThreshold <= 0) {
        errors.push(new Error('memory.leakThreshold must be a positive number'));
      }
    }

    return errors;
  }
}

/**
 * Budget validator instance.
 */
export const BudgetValidator = new BudgetValidatorImpl();

/**
 * Creates budget violations.
 */
export class BudgetViolationFactory {
  static createTimingViolation(
    operation: string,
    actual: number,
    budget: number,
    context?: ViolationContext
  ): BudgetViolation {
    const percentage = budget > 0 ? actual / budget : 0;
    const warningThreshold = 0.8;
    const criticalThreshold = 0.95;

    let severity: 'warning' | 'critical' = 'warning';
    if (percentage >= criticalThreshold) {
      severity = 'critical';
    } else if (percentage >= warningThreshold) {
      severity = 'warning';
    }

    return {
      type: 'timing',
      operation,
      actual,
      budget,
      percentage,
      severity,
      timestamp: Date.now(),
      context: context || {},
    };
  }

  static createMemoryViolation(
    operation: string,
    actual: number,
    budget: number,
    context?: ViolationContext
  ): BudgetViolation {
    const percentage = budget > 0 ? actual / budget : 0;
    const warningThreshold = 0.8;
    const criticalThreshold = 0.95;

    let severity: 'warning' | 'critical' = 'warning';
    if (percentage >= criticalThreshold) {
      severity = 'critical';
    } else if (percentage >= warningThreshold) {
      severity = 'warning';
    }

    return {
      type: 'memory',
      operation,
      actual,
      budget,
      percentage,
      severity,
      timestamp: Date.now(),
      context: context || {},
    };
  }
}

/**
 * Creates default performance budgets.
 */
export function createDefaultBudgets(): Required<PerformanceBudgets> {
  return { ...DEFAULT_BUDGETS };
}

/**
 * Creates custom performance budgets.
 *
 * @param custom - Partial custom budgets to override defaults
 * @returns Complete performance budgets
 */
export function createBudgets(custom?: PerformanceBudgets): Required<PerformanceBudgets> {
  const validator = new BudgetValidatorImpl();
  const errors = validator.validateBudgets(custom || {});
  if (errors.length > 0) {
    throw new Error(`Invalid budgets: ${errors.map((e) => e.message).join(', ')}`);
  }

  return {
    ...DEFAULT_BUDGETS,
    ...custom,
    memory: {
      ...DEFAULT_BUDGETS.memory,
      ...custom?.memory,
    },
    operations: {
      ...DEFAULT_BUDGETS.operations,
      ...custom?.operations,
    },
  };
}
