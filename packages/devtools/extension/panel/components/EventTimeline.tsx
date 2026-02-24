// Event Timeline Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'

export function EventTimeline({ tableId }: { tableId: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [filter, setFilter] = useState<any>({})
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  useEffect(() => {
    // Fetch events
    devToolsBridge.sendCommand({
      type: 'GET_EVENTS',
      tableId,
      filter
    }).then(setEvents)

    // Subscribe to new events
    const unsubscribe = devToolsBridge.onResponse((response) => {
      if (response.type === 'EVENT_LOGGED' && response.tableId === tableId) {
        setEvents(prev => [...prev, response.payload])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tableId, filter])

  const handleReplayEvent = (event: any) => {
    devToolsBridge.sendCommand({
      type: 'REPLAY_EVENT',
      tableId,
      event
    })
  }

  return (
    <div className="event-timeline">
      <div className="timeline-controls">
        <input
          type="text"
          placeholder="Filter by type..."
          value={filter.type || ''}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
        />
        <button onClick={() => setEvents([])}>Clear</button>
      </div>

      <div className="timeline-list">
        {events.map((event: any, index: number) => (
          <div
            key={index}
            className={`event-item ${selectedEvent === event ? 'selected' : ''}`}
            onClick={() => setSelectedEvent(event)}
          >
            <span className="event-type">{event?.event?.type || 'Unknown'}</span>
            <span className="event-time">{new Date(event?.timestamp || 0).toLocaleTimeString()}</span>
            <button onClick={(e) => { e.stopPropagation(); handleReplayEvent(event?.event) }}>
              Replay
            </button>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div className="event-details">
          <h3>Event Details</h3>
          <pre className="json-viewer">{JSON.stringify(selectedEvent, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
