// Main DevTools Panel Component

import React, { useState, useEffect, useCallback } from 'react';
import { devToolsBridge } from '@gridkit/devtools-bridge/DevToolsBridge';
import { sendDevToolsCommand } from '@gridkit/devtools-backend/hooks';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import type { DevToolsError } from './types/errors';
import { ErrorCode } from './types/errors';

// Components
import { TableInspector } from './components/TableInspector';
import { EventTimeline } from './components/EventTimeline';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { TimeTravelControls } from './components/TimeTravelControls';
import { StateDiffViewer } from './components/StateDiffViewer';
import { MemoryProfiler } from './components/MemoryProfiler';
import { PluginInspector } from './components/PluginInspector';

// Styles
import '../styles/index.css';

// SVG Icons
const InspectorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const EventsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const PerformanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TimeTravelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const StateDiffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const MemoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const PluginsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

interface TableMetadata {
  id: string;
  rowCount: number;
  columnCount: number;
}

interface DevToolsPanelProps {
  tables: TableMetadata[];
  selectedTableId: string;
  onTableSelect: (tableId: string) => void;
  connected?: boolean;
}

export function DevToolsPanel({
  tables,
  selectedTableId,
  onTableSelect,
  connected: parentConnected
}: DevToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<'inspector' | 'events' | 'performance' | 'time-travel' | 'state-diff' | 'memory' | 'plugins'>('inspector');
  const connectionStatus = useConnectionStatus();

  // Use parent connected status if provided, otherwise use hook
  const isConnected = parentConnected ?? connectionStatus.isConnected;

  const selectedTable = tables.find((t) => t && t.id === selectedTableId);

  const handleError = useCallback((error: DevToolsError): void => {
    console.error('[DevToolsPanel] Error caught:', error);
  }, []);

  const handleRetry = useCallback((): void => {
    console.log('[DevToolsPanel] Retry initiated');
    connectionStatus.attemptReconnect();
  }, [connectionStatus]);

  const getStatusText = (): string => {
    if (isConnected) return 'Connected';
    if (connectionStatus.attempts >= 3) return 'Connection Failed';
    return 'Connecting...';
  };

  const getStatusClass = (): string => {
    if (isConnected) return 'connected';
    if (connectionStatus.attempts >= 3) return 'error';
    return 'disconnected';
  };

  return (
    <ErrorBoundary onError={handleError} onRetry={handleRetry}>
      <div className="devtools-panel">
        <div className="devtools-header">
          <h1>GridKit DevTools</h1>
          <div className="connection-status">
            <span className={`status-dot ${getStatusClass()}`} />
            <span>{getStatusText()}</span>
            {!isConnected && connectionStatus.attempts > 0 && (
              <span className="connection-attempts">
                (Attempt {connectionStatus.attempts}/3)
              </span>
            )}
          </div>
        </div>

        <div className="devtools-content">
          {/* Table Selector */}
          <div className="table-selector">
            <label>Select Table:</label>
            <select
              value={selectedTableId}
              onChange={(e) => onTableSelect(String(e.target.value))}
            >
              {!tables || tables.length === 0 ? (
                <option value="" disabled>No tables detected</option>
              ) : (
                tables.map((table) => (
                  <option key={String(table.id)} value={String(table.id)}>
                    {String(table.id)} ({String(table.rowCount)} rows, {String(table.columnCount)} columns)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={activeTab === 'inspector' ? 'active' : ''}
              onClick={() => setActiveTab('inspector')}
            >
              <span className="icon"><InspectorIcon /></span>
              Inspector
            </button>
            <button
              className={activeTab === 'events' ? 'active' : ''}
              onClick={() => setActiveTab('events')}
            >
              <span className="icon"><EventsIcon /></span>
              Events
            </button>
            <button
              className={activeTab === 'performance' ? 'active' : ''}
              onClick={() => setActiveTab('performance')}
            >
              <span className="icon"><PerformanceIcon /></span>
              Performance
            </button>
            <button
              className={activeTab === 'time-travel' ? 'active' : ''}
              onClick={() => setActiveTab('time-travel')}
            >
              <span className="icon"><TimeTravelIcon /></span>
              Time Travel
            </button>
            <button
              className={activeTab === 'state-diff' ? 'active' : ''}
              onClick={() => setActiveTab('state-diff')}
            >
              <span className="icon"><StateDiffIcon /></span>
              State Diff
            </button>
            <button
              className={activeTab === 'memory' ? 'active' : ''}
              onClick={() => setActiveTab('memory')}
            >
              <span className="icon"><MemoryIcon /></span>
              Memory
            </button>
            <button
              className={activeTab === 'plugins' ? 'active' : ''}
              onClick={() => setActiveTab('plugins')}
            >
              <span className="icon"><PluginsIcon /></span>
              Plugins
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {!selectedTable ? (
              <div className="no-table-selected">
                <p>Select a table to inspect</p>
              </div>
            ) : (
              <>
                {activeTab === 'inspector' && (
                  <ErrorBoundary>
                    <TableInspector tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
                {activeTab === 'events' && (
                  <ErrorBoundary>
                    <EventTimeline tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
                {activeTab === 'performance' && (
                  <ErrorBoundary>
                    <PerformanceMonitor tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
                {activeTab === 'time-travel' && (
                  <ErrorBoundary>
                    <TimeTravelControls tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
                {activeTab === 'state-diff' && (
                  <ErrorBoundary>
                    <StateDiffViewer tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
                {activeTab === 'memory' && (
                  <ErrorBoundary>
                    <MemoryProfiler tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
                {activeTab === 'plugins' && (
                  <ErrorBoundary>
                    <PluginInspector tableId={String(selectedTable.id)} />
                  </ErrorBoundary>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
