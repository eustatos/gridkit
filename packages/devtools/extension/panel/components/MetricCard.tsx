// Metric Card Component

import React, { useMemo } from 'react';
import type { PerformanceStatus, TrendIndicator } from '../types/performance';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  status?: PerformanceStatus;
  trend?: TrendIndicator;
  warning?: boolean;
  critical?: boolean;
}

export function MetricCard({
  label,
  value,
  unit,
  status = 'good',
  trend,
  warning = false,
  critical = false,
}: MetricCardProps) {
  const statusColor = useMemo(() => {
    if (critical) return 'bg-red-100 border-red-500 text-red-800';
    if (warning) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-green-100 border-green-500 text-green-800';
  }, [critical, warning]);

  const trendArrow = useMemo(() => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <span className="trend-arrow up" title="Increased">↑</span>;
      case 'down':
        return <span className="trend-arrow down" title="Decreased">↓</span>;
      case 'stable':
        return <span className="trend-arrow stable" title="Stable">→</span>;
    }
  }, [trend]);

  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    }
    return value;
  }, [value]);

  return (
    <div className={`metric-card ${statusColor}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {formattedValue}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {trendArrow && <div className="metric-trend">{trendArrow}</div>}
    </div>
  );
}
