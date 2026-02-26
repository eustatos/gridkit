// Event Item Component

import React, { useState, useCallback } from 'react'
import type { DevToolsEvent } from '../types/events'

interface EventItemProps {
  event: DevToolsEvent;
}

/**
 * Formats timestamp as HH:mm:ss.mmm
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Extracts event type category from event data
 */
function getEventCategory(eventType: string): string {
  const type = eventType.toLowerCase();
  if (type.includes('sort')) return 'sorting';
  if (type.includes('select')) return 'selection';
  if (type.includes('page') || type.includes('filter')) return 'pagination';
  if (type.includes('state')) return 'state';
  return 'other';
}

/**
 * Copies text to clipboard
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

export const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const category = getEventCategory(event.type);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async () => {
    const eventJson = JSON.stringify(event, null, 2);
    await copyToClipboard(eventJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [event]);

  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'sorting':
        return 'event-type-sorting';
      case 'selection':
        return 'event-type-selection';
      case 'pagination':
        return 'event-type-pagination';
      case 'state':
        return 'event-type-state';
      default:
        return 'event-type-other';
    }
  };

  return (
    <div className={`event-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="event-header" onClick={handleToggleExpand}>
        <span className={`event-type ${getCategoryColor(category)}`}>
          {category}
        </span>
        <span className="event-timestamp">
          {formatTimestamp(event.timestamp)}
        </span>
        <button
          className="event-copy-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          title="Copy event to clipboard"
        >
          {copied ? '✓' : '📋'}
        </button>
        <span className="event-expand-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="event-details">
          <div className="event-detail-row">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{event.type}</span>
          </div>
          <div className="event-detail-row">
            <span className="detail-label">Table ID:</span>
            <span className="detail-value">{event.tableId}</span>
          </div>
          <div className="event-detail-row">
            <span className="detail-label">Payload:</span>
            <pre className="detail-payload">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
