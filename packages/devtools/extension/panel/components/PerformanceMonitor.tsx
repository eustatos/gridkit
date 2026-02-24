// Performance Monitor Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'

export function PerformanceMonitor({ tableId }: { tableId: string }) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [flamegraph, setFlamegraph] = useState<any>(null)

  useEffect(() => {
    // Fetch performance data
    devToolsBridge.sendCommand({
      type: 'GET_PERFORMANCE',
      tableId
    }).then(setMetrics)

    // Subscribe to updates
    const unsubscribe = devToolsBridge.onResponse((response) => {
      if (response.type === 'PERFORMANCE_UPDATE' && response.tableId === tableId) {
        setMetrics(prev => [...prev, response.payload.metrics])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tableId])

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>Performance Monitor</h2>
        <button onClick={() => setMetrics([])}>Clear</button>
      </div>

      <div className="monitor-grid">
        <div className="metrics-chart">
          <h3>Render Time</h3>
          {metrics.length > 0 ? (
            <div className="chart">
              {metrics.slice(-10).map((m: any, i: number) => (
                <div key={i} className="bar">
                  <span>{m.renderTime}ms</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No data yet</div>
          )}
        </div>

        <div className="metrics-summary">
          <h3>Summary</h3>
          <div className="summary-cards">
            <div className="card">
              <span className="label">Avg Render</span>
              <span className="value">
                {metrics.length > 0
                  ? Math.round(metrics.reduce((sum: number, m: any) => sum + m.renderTime, 0) / metrics.length)
                  : 0}ms
              </span>
            </div>
            <div className="card">
              <span className="label">Total Events</span>
              <span className="value">{metrics.reduce((sum: number, m: any) => sum + m.eventCount, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flamegraph-section">
        <h3>Flame Graph</h3>
        {flamegraph ? (
          <div className="flamegraph-viewer">
            <pre>{JSON.stringify(flamegraph, null, 2)}</pre>
          </div>
        ) : (
          <div className="empty-state">No profiling data</div>
        )}
      </div>

      <div className="bottlenecks">
        <h3>Bottlenecks</h3>
        {metrics.length > 0 ? (
          <div className="bottleneck-list">
            {metrics.filter(m => m.renderTime > 100).map((m: any, i: number) => (
              <div key={i} className="bottleneck-item">
                <span className="time">{m.renderTime}ms</span>
                <span className="components">{m.components?.length || 0} components</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No bottlenecks detected</div>
        )}
      </div>
    </div>
  )
}
