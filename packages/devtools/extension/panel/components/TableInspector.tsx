// Table Inspector Component

import React from 'react'

export function TableInspector({ tableId }: { tableId: string }) {
  return (
    <div className="table-inspector">
      <div className="inspector-header">
        <h2>Table Inspector</h2>
        <span className="table-id">{String(tableId)}</span>
      </div>

      <div className="inspector-tabs">
        <div className="tab">
          <h3>Table Info</h3>
          <div className="table-info">
            <p><strong>ID:</strong> {String(tableId)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
