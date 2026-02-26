// Event Timeline Component

import React, { useState, useCallback, useRef } from 'react';
import type { DevToolsEvent, EventType, EventFilter } from '../types/events';
import { EventItem } from './EventItem';

const MAX_EVENTS = 100;

interface EventTimelineProps {
  tableId: string;
  events?: DevToolsEvent[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ tableId, events: propEvents = [] }) => {
  const [filter, setFilter] = useState<EventType>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Use events from props
  const displayEvents = propEvents || [];

  /**
   * Get category from event type
   */
  const getEventCategory = (eventType: string): string => {
    const type = eventType.toLowerCase();
    if (type.includes('sort')) return 'sorting';
    if (type.includes('select')) return 'selection';
    if (type.includes('page') || type.includes('filter')) return 'pagination';
    if (type.includes('state')) return 'state';
    return 'other';
  };

  /**
   * Filter events based on current filter
   */
  const filteredEvents = displayEvents.filter((event) => {
    if (filter === 'all') return true;
    const category = getEventCategory(event.type);
    return category === filter;
  });

  /**
   * Clear all events
   */
  const handleClearEvents = useCallback(() => {
    // Clear is handled by parent component
    console.log('[EventTimeline] Clear requested');
  }, []);

  /**
   * Toggle pause/resume
   */
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  /**
   * Filter change handler
   */
  const handleFilterChange = useCallback((newFilter: EventType) => {
    setFilter(newFilter);
  }, []);

  return (
    <div className="event-timeline">
      <div className="timeline-header">
        <h3 className="timeline-title">Event Timeline</h3>
        <div className="timeline-controls">
          <span className="event-count-badge">{displayEvents.length}</span>
          <button
            className="control-btn pause-btn"
            onClick={handleTogglePause}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            className="control-btn clear-btn"
            onClick={handleClearEvents}
            title="Clear all events"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="timeline-filters">
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as EventType)}
        >
          <option value="all">All Events ({displayEvents.length})</option>
          <option value="sorting">Sorting</option>
          <option value="selection">Selection</option>
          <option value="pagination">Pagination</option>
          <option value="state">State</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="timeline-content">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <p>{displayEvents.length === 0 ? 'No events yet' : 'No events match filter'}</p>
            <p className="empty-state-hint">
              {displayEvents.length === 0
                ? 'Interact with the table to see events'
                : 'Try changing the filter'}
            </p>
          </div>
        ) : (
          <div className="event-list">
            {filteredEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
            <div ref={eventsEndRef} />
          </div>
        )}
      </div>

      {isPaused && <div className="paused-overlay">Event streaming paused</div>}
    </div>
  );
};
