// Main DevTools Panel Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'
import { sendDevToolsCommand } from '../backend/hooks'

// Components
import { TableInspector } from './components/TableInspector'
import { EventTimeline } from './components/EventTimeline'
import { PerformanceMonitor } from './components/PerformanceMonitor'
import { TimeTravelControls } from './components/TimeTravelControls'
import { StateDiffViewer } from './components/StateDiffViewer'
import { MemoryProfiler } from './components/MemoryProfiler'
import { PluginInspector } from './components/PluginInspector'

// Styles
import '../styles/panel.css'

export function DevToolsPanel({
  tables,
  selectedTableId,
  onTableSelect,
  connected
}: {
  tables: any[]
  selectedTableId: string | null
  onTableSelect: (tableId: string) => void
  connected: boolean
}) {
  const [activeTab, setActiveTab] = useState<'inspector' | 'events' | 'performance' | 'time-travel' | 'state-diff' | 'memory' | 'plugins'>('inspector')

  const selectedTable = tables.find(t => t.id === selectedTableId)

  return (
    <div className="devtools-panel">
      <div className="devtools-header">
        <h1>GridKit DevTools</h1>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="devtools-content">
        {/* Table Selector */}
        <div className="table-selector">
          <label>Select Table:</label>
          <select
            value={selectedTableId || ''}
            onChange={(e) => onTableSelect(e.target.value)}
          >
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                {table.id} ({table.rowCount} rows, {table.columnCount} columns)
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'inspector' ? 'active' : ''}
            onClick={() => setActiveTab('inspector')}
          >
            <span className="icon">📋</span>
            Inspector
          </button>
          <button
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            <span className="icon">📜</span>
            Events
          </button>
          <button
            className={activeTab === 'performance' ? 'active' : ''}
            onClick={() => setActiveTab('performance')}
          >
            <span className="icon">📊</span>
            Performance
          </button>
          <button
            className={activeTab === 'time-travel' ? 'active' : ''}
            onClick={() => setActiveTab('time-travel')}
          >
            <span className="icon">⏳</span>
            Time Travel
          </button>
          <button
            className={activeTab === 'state-diff' ? 'active' : ''}
            onClick={() => setActiveTab('state-diff')}
          >
            <span className="icon">🔄</span>
            State Diff
          </button>
          <button
            className={activeTab === 'memory' ? 'active' : ''}
            onClick={() => setActiveTab('memory')}
          >
            <span className="icon">🧠</span>
            Memory
          </button>
          <button
            className={activeTab === 'plugins' ? 'active' : ''}
            onClick={() => setActiveTab('plugins')}
          >
            <span className="icon">🔌</span>
            Plugins
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {selectedTable ? (
            <>
              {activeTab === 'inspector' && (
                <TableInspector tableId={selectedTable.id} table={selectedTable} />
              )}
              {activeTab === 'events' && (
                <EventTimeline tableId={selectedTable.id} />
              )}
              {activeTab === 'performance' && (
                <PerformanceMonitor tableId={selectedTable.id} />
              )}
              {activeTab === 'time-travel' && (
                <TimeTravelControls tableId={selectedTable.id} />
              )}
              {activeTab === 'state-diff' && (
                <StateDiffViewer tableId={selectedTable.id} />
              )}
              {activeTab === 'memory' && (
                <MemoryProfiler tableId={selectedTable.id} />
              )}
              {activeTab === 'plugins' && (
                <PluginInspector tableId={selectedTable.id} />
              )}
            </>
          ) : (
            <div className="no-table-selected">
              <p>Select a table to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
