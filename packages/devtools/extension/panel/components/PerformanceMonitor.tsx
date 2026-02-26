// Performance Monitor Component

import React from 'react'

export function PerformanceMonitor({ tableId }: { tableId: string }) {
  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>Performance Monitor</h2>
      </div>
      <div className="empty-state">
        <p>Performance monitoring coming soon</p>
      </div>
    </div>
  )
}
