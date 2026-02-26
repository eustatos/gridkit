// Time Travel Controls Component

import React from 'react'

export function TimeTravelControls({ tableId }: { tableId: string }) {
  return (
    <div className="time-travel-controls">
      <div className="controls-header">
        <h2>Time Travel</h2>
      </div>
      <div className="empty-state">
        <p>Time travel coming soon</p>
      </div>
    </div>
  )
}
