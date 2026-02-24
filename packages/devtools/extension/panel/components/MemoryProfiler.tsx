// Memory Profiler Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'

export function MemoryProfiler({ tableId }: { tableId: string }) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [leaks, setLeaks] = useState<any[]>([])

  useEffect(() => {
    // Fetch memory data
    devToolsBridge.sendCommand({
      type: 'GET_MEMORY',
      tableId
    }).then((data: any) => {
      setSnapshots(data.snapshots || [])
      setLeaks(data.leaks || [])
    })

    // Subscribe to updates
    const unsubscribe = devToolsBridge.onResponse((response) => {
      if (response.type === 'MEMORY_UPDATE' && response.tableId === tableId) {
        setSnapshots(prev => [...prev, response.payload.snapshot])
        setLeaks(response.payload.leaks || [])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tableId])

  const takeSnapshot = () => {
    devToolsBridge.sendCommand({
      type: 'GET_MEMORY',
      tableId
    }).then((data: any) => {
      setSnapshots(prev => [...prev, ...(data.snapshots || [])])
      setLeaks(data.leaks || [])
    })
  }

  return (
    <div className="memory-profiler">
      <div className="profiler-header">
        <h2>Memory Profiler</h2>
        <button onClick={takeSnapshot}>Take Snapshot</button>
      </div>

      <div className="memory-chart">
        <h3>Memory Usage Over Time</h3>
        {snapshots.length > 0 ? (
          <div className="chart">
            {snapshots.map((s: any, i: number) => (
              <div key={i} className="memory-bar">
                <span className="heap-size">{Math.round(s.heapSize / 1024)} KB</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No memory data yet</div>
        )}
      </div>

      <div className="leaks-section">
        <h3>Memory Leaks ({leaks.length})</h3>
        {leaks.length > 0 ? (
          <div className="leaks-list">
            {leaks.map((leak: any, i: number) => (
              <div key={i} className="leak-item">
                <span className="leak-type">{leak.type}</span>
                <span className="leak-details">{leak.details}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No leaks detected</div>
        )}
      </div>

      <div className="objects-section">
        <h3>Tracked Objects</h3>
        {snapshots.length > 0 ? (
          <div className="objects-table">
            {snapshots.map((s: any, i: number) => (
              <div key={i} className="object-row">
                <span className="timestamp">{new Date(s.timestamp).toLocaleTimeString()}</span>
                <span className="tracked-objects">{s.trackedObjects || 0}</span>
                <span className="leaked-objects">{s.leakedObjects?.length || 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No tracked objects data</div>
        )}
      </div>
    </div>
  )
}
