// Event Timeline Component

import React from 'react'

export function EventTimeline({ tableId }: { tableId: string }) {
  return (
    <div className="event-timeline">
      <div className="timeline-controls">
        <h3>Events for: {String(tableId)}</h3>
      </div>
      <div className="empty-state">
        <p>Event monitoring coming soon</p>
      </div>
    </div>
  )
}
