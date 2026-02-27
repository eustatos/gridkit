// Performance Monitoring Types

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderDuration: number | null;
  averageRenderDuration: number | null;
  totalRenderTime: number;
  reRenderReason: string | null;
  timestamp: number;
  tableId: string;
}

export interface PerformanceHistory {
  entries: PerformanceMetrics[];
  min: number;
  max: number;
  average: number;
}

export interface PerformanceThresholds {
  renderDurationWarning: number;
  renderDurationCritical: number;
  averageDurationWarning: number;
  averageDurationCritical: number;
  renderCountPerMinuteWarning: number;
  renderCountPerMinuteCritical: number;
}

export type PerformanceStatus = 'good' | 'warning' | 'critical';

export interface TrendIndicator {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderDurationWarning: 100,
  renderDurationCritical: 500,
  averageDurationWarning: 80,
  averageDurationCritical: 300,
  renderCountPerMinuteWarning: 60,
  renderCountPerMinuteCritical: 120,
};

export const MAX_HISTORY_SIZE = 10;
