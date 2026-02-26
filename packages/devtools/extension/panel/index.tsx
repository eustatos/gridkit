// DevTools Panel Main Component

import React, { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { TABLE_REGISTERED, TABLE_UNREGISTERED, TABLES_LIST, EVENT_LOGGED } from '@gridkit/devtools-bridge/messages'
import { DevToolsPanel } from './DevToolsPanel'

// Types
interface TableMetadata {
  id: string
  rowCount: number
  columnCount: number
  state: any
  options?: any
  performance?: any
  memory?: any
}

// Event type for DevTools events
interface DevToolsEvent {
  id: string
  type: string
  tableId: string
  timestamp: number
  payload: Record<string, unknown>
}

function DevToolsPanelContainer() {
  const [tables, setTables] = useState<TableMetadata[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<DevToolsEvent[]>([])

  const handleTableRegistered = useCallback((message: any) => {
    console.log('[DevTools Panel] TABLE_REGISTERED:', message.payload)
    const table = message.payload?.table
    const tableId = table && typeof table === 'object' ? table.id : table
    setTables(prev => [...prev, message.payload.table])
    if (!selectedTableId && tableId) {
      setSelectedTableId(String(tableId))
    }
  }, [selectedTableId])

  const handleTableUnregistered = useCallback((message: any) => {
    console.log('[DevTools Panel] TABLE_UNREGISTERED:', message.payload)
    const tableId = message.payload?.tableId
    setTables(prev => prev.filter(t => {
      const tId = t && typeof t === 'object' ? t.id : t
      return String(tId) !== String(tableId)
    }))
    if (String(selectedTableId) === String(tableId)) {
      setSelectedTableId('')
    }
  }, [selectedTableId])

  const handleEventLogged = useCallback((message: any) => {
    console.log('[DevTools Panel] EVENT_LOGGED:', message)
    const event = message.payload?.event
    const tableId = message.tableId
    const timestamp = message.payload?.timestamp || Date.now()
    
    if (event && tableId) {
      const newEvent: DevToolsEvent = {
        id: `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        type: event.type || 'unknown',
        tableId: String(tableId),
        timestamp,
        payload: message.payload || {}
      }
      
      setEvents(prev => {
        const updated = [newEvent, ...prev]
        // Limit to 100 events
        if (updated.length > 100) {
          return updated.slice(0, 100)
        }
        return updated
      })
    }
  }, [])

  // Connect to background script
  useEffect(() => {
    console.log('[DevTools Panel] Connecting to background...')

    const port = chrome.runtime.connect({
      name: 'gridkit-devtools-panel'
    })

    console.log('[DevTools Panel] Port created:', port.name)

    // Send tabId to background
    // For DevTools panels, we need to get tabId from chrome.devtools.inspectedWindow
    const tabId = chrome.devtools?.inspectedWindow?.tabId
    console.log('[DevTools Panel] Sending INIT with tabId:', tabId)
    port.postMessage({
      type: 'INIT',
      tabId: tabId
    })

    port.onMessage.addListener((message) => {
      console.log('[DevTools Panel] Received from background:', message.type, message)
      console.log('[DevTools Panel] Message payload:', message.payload)
      console.log('[DevTools Panel] Payload tables:', message.payload?.tables)

      if (message.type === TABLES_LIST) {
        const tables = message.payload?.tables || []
        console.log('[DevTools Panel] Tables received:', tables)
        setTables(tables)
        if (tables.length > 0 && !selectedTableId) {
          setSelectedTableId(String(tables[0].id))
        }
      } else if (message.type === TABLE_REGISTERED) {
        console.log('[DevTools Panel] TABLE_REGISTERED:', message.payload)
        handleTableRegistered(message)
      } else if (message.type === TABLE_UNREGISTERED) {
        console.log('[DevTools Panel] TABLE_UNREGISTERED:', message.payload)
        handleTableUnregistered(message)
      } else if (message.type === EVENT_LOGGED) {
        console.log('[DevTools Panel] EVENT_LOGGED:', message)
        handleEventLogged(message)
      } else if (message.type === 'ERROR') {
        console.error('[DevTools Panel] Error from background:', message.error)
      }
    })

    port.onDisconnect.addListener(() => {
      console.log('[DevTools Panel] Port disconnected')
      setConnected(false)
    })

    setConnected(true)

    return () => {
      console.log('[DevTools Panel] Disconnecting...')
      port.disconnect()
    }
  }, [handleTableRegistered, handleTableUnregistered, handleEventLogged, selectedTableId])

  console.log('[DevTools Panel] Rendering with tables:', tables)
  console.log('[DevTools Panel] Events count:', events.length)

  return (
    <DevToolsPanel
      tables={tables}
      selectedTableId={selectedTableId}
      onTableSelect={(tableId: string) => {
        console.log('[DevTools Panel] Table selected:', tableId)
        setSelectedTableId(String(tableId))
      }}
      connected={connected}
      events={events}
    />
  )
}

// Render
const root = document.getElementById('root')
const app = root ? createRoot(root) : null
if (app) {
  app.render(<DevToolsPanelContainer />)
} else {
  console.error('[DevTools Panel] Root element not found')
}

export { DevToolsPanelContainer }
