// Event Timeline Component

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { devToolsBridge } from '@gridkit/devtools-bridge/DevToolsBridge';
import { EVENT_LOGGED, TABLE_UNREGISTERED } from '@gridkit/devtools-bridge/messages';
import type { DevToolsEvent, EventType, EventFilter } from '../types/events';
import { EventItem } from './EventItem';

const MAX_EVENTS = 100;

interface EventTimelineProps {
  tableId: string;
  events?: DevToolsEvent[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ tableId, events: propEvents = [] }) => {
  const [events, setEvents] = useState<DevToolsEvent[]>([]);
  const [filter, setFilter] = useState<EventType>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [eventCount, setEventCount] = useState<number>(0);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Use events from props if provided, otherwise use internal state
  const displayEvents = propEvents.length > 0 ? propEvents : events;

  /**
   * Generate unique event ID
   */
  const generateEventId = useCallback((timestamp: number, type: string): string => {
    return `${timestamp}-${type}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Get event type from payload
   */
  const getEventTypeFromPayload = useCallback((payload: Record<string, unknown>): string => {
    if (payload.event && typeof payload.event === 'object') {
      const event = payload.event as Record<string, unknown>;
      if (event.type && typeof event.type === 'string') {
        return event.type;
      }
    }
    return 'unknown';
  }, []);

  /**
   * Handle incoming event from bridge
   */
  const handleEvent = useCallback(
    (message: unknown) => {
      if (isPaused) return;

      const msg = message as {
        tableId?: string;
        payload?: {
          event?: Record<string, unknown>;
          timestamp?: number;
        };
      };

      // Only process events for current table
      if (msg.tableId !== tableId) return;
      if (!msg.payload) return;

      const timestamp = msg.payload.timestamp ?? Date.now();
      const eventType = getEventTypeFromPayload(msg.payload);

      const newEvent: DevToolsEvent = {
        id: generateEventId(timestamp, eventType),
        type: eventType,
        tableId: msg.tableId || tableId,
        timestamp,
        payload: msg.payload as Record<string, unknown>,
      };

      setEvents((prev) => {
        const updated = [newEvent, ...prev];
        // Limit to MAX_EVENTS
        if (updated.length > MAX_EVENTS) {
          return updated.slice(0, MAX_EVENTS);
        }
        return updated;
      });

      setEventCount((prev) => prev + 1);
    },
    [tableId, isPaused, generateEventId, getEventTypeFromPayload]
  );

  /**
   * Handle table unregistration - clear events
   */
  const handleTableUnregister = useCallback(
    (message: unknown) => {
      const msg = message as { tableId?: string };
      if (msg.tableId === tableId) {
        setEvents([]);
        setEventCount(0);
      }
    },
    [tableId]
  );

  /**
   * Subscribe to bridge events
   */
  useEffect(() => {
    // Subscribe to EVENT_LOGGED messages
    const unsubscribeEvents = devToolsBridge.onCommand(EVENT_LOGGED, handleEvent);

    // Subscribe to TABLE_UNREGISTERED messages
    const unsubscribeUnregister = devToolsBridge.onCommand(
      TABLE_UNREGISTERED,
      handleTableUnregister
    );

    // Cleanup on unmount
    return () => {
      unsubscribeEvents();
      unsubscribeUnregister();
    };
  }, [tableId, handleEvent, handleTableUnregister]);

  /**
   * Auto-scroll to newest event
   */
  useEffect(() => {
    if (events.length > 0 && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length]);

  /**
   * Clear all events
   */
  const handleClearEvents = useCallback(() => {
    setEvents([]);
    setEventCount(0);
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
            <p>{events.length === 0 ? 'No events yet' : 'No events match filter'}</p>
            <p className="empty-state-hint">
              {events.length === 0
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
