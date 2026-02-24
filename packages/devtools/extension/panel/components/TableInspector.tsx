// Table Inspector Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'

export function TableInspector({ tableId, table }: { tableId: string, table: any }) {
  const [state, setState] = useState<any>(null)
  const [columns, setColumns] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    // Fetch initial state
    devToolsBridge.sendCommand({
      type: 'GET_STATE',
      tableId
    }).then(setState)

    // Subscribe to state updates
    const unsubscribe = devToolsBridge.onResponse((response) => {
      if (response.type === 'STATE_UPDATE' && response.tableId === tableId) {
        setState(response.payload.state)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tableId])

  return (
    <div className="table-inspector">
      <div className="inspector-header">
        <h2>Table Inspector</h2>
        <span className="table-id">{tableId}</span>
      </div>

      <div className="inspector-tabs">
        <div className="tab">
          <h3>State</h3>
          <div className="state-viewer">
            <pre className="json-viewer">{JSON.stringify(state, null, 2)}</pre>
          </div>
        </div>

        <div className="tab">
          <h3>Columns ({table?.columnCount || 'N/A'})</h3>
          <div className="columns-viewer">
            {columns.map((col: any, i: number) => (
              <div key={i} className="column-item">
                {col?.id || 'Unknown'}
              </div>
            ))}
          </div>
        </div>

        <div className="tab">
          <h3>Rows ({table?.rowCount || 'N/A'})</h3>
          <div className="rows-viewer">
            {rows.map((row: any, i: number) => (
              <div key={i} className="row-item">
                Row {i}
              </div>
            ))}
          </div>
        </div>

        <div className="tab">
          <h3>Config</h3>
          <div className="config-viewer">
            <pre className="json-viewer">{JSON.stringify(table?.options || {}, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
