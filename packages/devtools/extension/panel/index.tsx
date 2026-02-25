// DevTools Panel Main Component

import React, { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { TABLE_REGISTERED, TABLE_UNREGISTERED, TABLES_LIST } from '@gridkit/devtools-bridge/messages'

import { DevToolsPanel as DevToolsPanelComponent } from './DevToolsPanel'

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

function DevToolsPanelContainer() {
  const [tables, setTables] = useState<TableMetadata[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const handleTableRegistered = useCallback((message: any) => {
    console.log('[DevTools Panel] TABLE_REGISTERED:', message.payload)
    setTables(prev => [...prev, message.payload.table])
    if (!selectedTableId) {
      setSelectedTableId(message.payload.table.id)
    }
  }, [selectedTableId])

  const handleTableUnregistered = useCallback((message: any) => {
    console.log('[DevTools Panel] TABLE_UNREGISTERED:', message.payload)
    setTables(prev => prev.filter(t => t.id !== message.payload.tableId))
    if (selectedTableId === message.payload.tableId) {
      setSelectedTableId(null)
    }
  }, [selectedTableId])

  // Connect to background script
  useEffect(() => {
    console.log('[DevTools Panel] Connecting to background...')
    
    const port = chrome.runtime.connect({
      name: 'gridkit-devtools-panel'
    })

    port.onMessage.addListener((message) => {
      console.log('[DevTools Panel] Received from background:', message)
      
      if (message.type === TABLES_LIST) {
        console.log('[DevTools Panel] Tables list:', message.payload.tables)
        setTables(message.payload.tables)
        if (message.payload.tables.length > 0 && !selectedTableId) {
          setSelectedTableId(message.payload.tables[0].id)
        }
      } else if (message.type === TABLE_REGISTERED) {
        handleTableRegistered(message)
      } else if (message.type === TABLE_UNREGISTERED) {
        handleTableUnregistered(message)
      }
    })

    port.onDisconnect.addListener(() => {
      console.log('[DevTools Panel] Port disconnected')
      setConnected(false)
    })

    setConnected(true)

    // Request tables list
    port.postMessage({
      type: 'GET_TABLES'
    })

    return () => {
      console.log('[DevTools Panel] Disconnecting...')
      port.disconnect()
    }
  }, [handleTableRegistered, handleTableUnregistered, selectedTableId])

  console.log('[DevTools Panel] Rendering with tables:', tables)

  return (
    <DevToolsPanelComponent
      tables={tables}
      selectedTableId={selectedTableId}
      onTableSelect={setSelectedTableId}
      connected={connected}
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
