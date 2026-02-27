// Performance Monitor Component

import React, { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { MetricCard } from './MetricCard';
import { usePerformanceHistory } from '../hooks/usePerformanceHistory';
import type { PerformanceMetrics, PerformanceStatus, TrendIndicator } from '../types/performance';
import { DEFAULT_THRESHOLDS } from '../types/performance';
import { devToolsBridge } from '../../bridge/DevToolsBridge';
import type { DevToolsMessage } from '../../bridge/messages';

interface PerformanceMonitorProps {
  tableId: string;
}

export function PerformanceMonitor({ tableId }: PerformanceMonitorProps): ReactElement {
  const { history, currentMetrics, previousMetrics, addMetric, clearHistory } = usePerformanceHistory();
  const [isConnected, setIsConnected] = useState(true);
  const isInitialized = useRef(false);

  // Subscribe to performance updates
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      setIsConnected(true);
      console.log('[PerformanceMonitor] Initialized for table:', tableId);
    }

    const handleMessage = (message: DevToolsMessage): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const payload = message.payload as Record<string, unknown> | undefined;
      console.log('[PerformanceMonitor] Received message:', message.type, payload);
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message.type === 'PERFORMANCE_UPDATE' &&
        payload &&
        typeof payload === 'object' &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'tableId' in payload &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        payload.tableId === tableId
      ) {
        console.log('[PerformanceMonitor] Adding metric:', payload);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        addMetric(message.payload as PerformanceMetrics);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bridge = devToolsBridge as unknown as {
      onMessage: (handler: (msg: DevToolsMessage) => void) => void;
      offMessage: (handler: (msg: DevToolsMessage) => void) => void;
      sendCommand: (cmd: string, params: Record<string, unknown>) => Promise<unknown>;
    };

    bridge.onMessage(handleMessage);
    console.log('[PerformanceMonitor] Subscribed to messages');

    // Request initial performance data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void bridge
      .sendCommand('GET_PERFORMANCE', { tableId })
      .then((metrics: unknown) => {
        console.log('[PerformanceMonitor] GET_PERFORMANCE response:', metrics);
        if (metrics && Array.isArray(metrics)) {
          (metrics as unknown[]).forEach((m: unknown) => addMetric(m as PerformanceMetrics));
        }
      })
      .catch((err: unknown) => {
        console.log('[PerformanceMonitor] GET_PERFORMANCE error:', err);
      });

    return () => {
      setIsConnected(false);
      bridge.offMessage(handleMessage);
      console.log('[PerformanceMonitor] Cleanup');
    };
  }, [tableId, addMetric]);

  // Calculate trend indicators
  const trends = useMemo(() => {
    if (!currentMetrics || !previousMetrics) {
      return {
        renderCount: { direction: 'stable' as const, percentage: 0 },
        lastRenderDuration: { direction: 'stable' as const, percentage: 0 },
        averageRenderDuration: { direction: 'stable' as const, percentage: 0 },
      };
    }

    const calculateTrend = (
      current: number | null,
      previous: number | null
    ): TrendIndicator => {
      if (current === null || previous === null || previous === 0) {
        return { direction: 'stable', percentage: 0 };
      }
      const percentage = ((current - previous) / previous) * 100;
      const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
      return { direction, percentage: Math.abs(percentage) };
    };

    return {
      renderCount: calculateTrend(
        currentMetrics.renderCount,
        previousMetrics.renderCount
      ),
      lastRenderDuration: calculateTrend(
        currentMetrics.lastRenderDuration,
        previousMetrics.lastRenderDuration
      ),
      averageRenderDuration: calculateTrend(
        currentMetrics.averageRenderDuration,
        previousMetrics.averageRenderDuration
      ),
    };
  }, [currentMetrics, previousMetrics]);

  // Determine status based on thresholds
  const status = useMemo(() => {
    if (!currentMetrics) return 'good' as PerformanceStatus;

    const { lastRenderDuration, averageRenderDuration } = currentMetrics;

    if (
      (lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationCritical ||
      (averageRenderDuration ?? 0) > DEFAULT_THRESHOLDS.averageDurationCritical
    ) {
      return 'critical';
    }

    if (
      (lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationWarning ||
      (averageRenderDuration ?? 0) > DEFAULT_THRESHOLDS.averageDurationWarning
    ) {
      return 'warning';
    }

    return 'good';
  }, [currentMetrics]);

  // Calculate renders per minute
  const rendersPerMinute = useMemo(() => {
    if (history.entries.length < 2) return 0;
    const firstEntry = history.entries[0];
    const lastEntry = history.entries[history.entries.length - 1];
    const timeDiffMinutes = (lastEntry.timestamp - firstEntry.timestamp) / 60000;
    if (timeDiffMinutes === 0) return 0;
    return Math.round((lastEntry.renderCount - firstEntry.renderCount) / timeDiffMinutes);
  }, [history.entries]);

  // Check threshold alerts
  const alerts = useMemo(() => {
    const alertsList: string[] = [];

    if ((currentMetrics?.lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationCritical) {
      alertsList.push(`Critical: Render took ${(currentMetrics?.lastRenderDuration ?? 0).toFixed(2)}ms`);
    } else if ((currentMetrics?.lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationWarning) {
      alertsList.push(`Warning: Render took ${(currentMetrics?.lastRenderDuration ?? 0).toFixed(2)}ms`);
    }

    if ((currentMetrics?.averageRenderDuration ?? 0) > DEFAULT_THRESHOLDS.averageDurationCritical) {
      alertsList.push(`Critical: Average render time ${(currentMetrics?.averageRenderDuration ?? 0).toFixed(2)}ms`);
    }

    if (rendersPerMinute > DEFAULT_THRESHOLDS.renderCountPerMinuteCritical) {
      alertsList.push(`Critical: ${rendersPerMinute} renders/minute`);
    }

    return alertsList;
  }, [currentMetrics, rendersPerMinute]);

  const overallStatus = useMemo(() => {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-green-500';
  }, [status]);

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>Performance Monitor</h2>
        <div className={`status-indicator ${overallStatus}`} title={`Status: ${status}`} />
        {!isConnected && <span className="disconnected-badge">Disconnected</span>}
      </div>

      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert ${alert.toLowerCase().includes('critical') ? 'critical' : 'warning'}`}>
              ⚠️ {alert}
            </div>
          ))}
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          label="Render Count"
          value={currentMetrics?.renderCount ?? 0}
          trend={trends.renderCount}
          warning={rendersPerMinute > DEFAULT_THRESHOLDS.renderCountPerMinuteWarning}
          critical={rendersPerMinute > DEFAULT_THRESHOLDS.renderCountPerMinuteCritical}
        />

        <MetricCard
          label="Last Render"
          value={currentMetrics?.lastRenderDuration}
          unit="ms"
          trend={trends.lastRenderDuration}
          warning={(currentMetrics?.lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationWarning}
          critical={(currentMetrics?.lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationCritical}
        />

        <MetricCard
          label="Average Render"
          value={currentMetrics?.averageRenderDuration}
          unit="ms"
          trend={trends.averageRenderDuration}
          warning={(currentMetrics?.averageRenderDuration ?? 0) > DEFAULT_THRESHOLDS.averageDurationWarning}
          critical={(currentMetrics?.averageRenderDuration ?? 0) > DEFAULT_THRESHOLDS.averageDurationCritical}
        />

        <MetricCard
          label="Total Time"
          value={currentMetrics?.totalRenderTime ?? 0}
          unit="ms"
        />

        <MetricCard
          label="Re-render Reason"
          value={currentMetrics?.reRenderReason ?? '—'}
        />

        <MetricCard
          label="Renders/min"
          value={rendersPerMinute}
          warning={rendersPerMinute > DEFAULT_THRESHOLDS.renderCountPerMinuteWarning}
          critical={rendersPerMinute > DEFAULT_THRESHOLDS.renderCountPerMinuteCritical}
        />
      </div>

      {history.entries.length > 0 && (
        <div className="performance-history">
          <h3>History (Last {history.entries.length} renders)</h3>
          <div className="history-stats">
            <span>Min: <strong>{history.min.toFixed(2)}ms</strong></span>
            <span>Max: <strong>{history.max.toFixed(2)}ms</strong></span>
            <span>Avg: <strong>{history.average.toFixed(2)}ms</strong></span>
          </div>
          <div className="sparkline">
            {history.entries.map((entry, index) => {
              const height = history.max > 0
                ? Math.max(10, ((entry.lastRenderDuration ?? 0) / history.max) * 100)
                : 10;
              const isWarning = (entry.lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationWarning;
              const isCritical = (entry.lastRenderDuration ?? 0) > DEFAULT_THRESHOLDS.renderDurationCritical;
              return (
                <div
                  key={index}
                  className={`sparkline-bar ${isCritical ? 'critical' : isWarning ? 'warning' : 'good'}`}
                  style={{ height: `${height}%` }}
                  title={`${(entry.lastRenderDuration ?? 0).toFixed(2)}ms`}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="monitor-footer">
        <button onClick={clearHistory} className="clear-button" type="button">
          Clear History
        </button>
      </div>
    </div>
  );
}
