// State Diff Viewer Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'

export function StateDiffViewer({ tableId }: { tableId: string }) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null)
  const [previousSnapshot, setPreviousSnapshot] = useState<any>(null)

  useEffect(() => {
    // Fetch snapshots
    devToolsBridge.sendCommand({
      type: 'GET_SNAPSHOTS',
      tableId
    }).then(setSnapshots)
  }, [tableId])

  const handleSnapshotSelect = (snapshot: any) => {
    setSelectedSnapshot(snapshot)
    
    // Find previous snapshot
    const index = snapshots.findIndex(s => s.timestamp === snapshot.timestamp)
    if (index > 0) {
      setPreviousSnapshot(snapshots[index - 1])
    } else {
      setPreviousSnapshot(null)
    }
  }

  const computeDiff = (prev: any, current: any): any => {
    if (!prev || !current) return null

    const diff: any = {}
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(current)])

    allKeys.forEach(key => {
      const prevValue = prev[key]
      const currentValue = current[key]

      if (JSON.stringify(prevValue) !== JSON.stringify(currentValue)) {
        diff[key] = {
          previous: prevValue,
          current: currentValue
        }
      }
    })

    return diff
  }

  const diff = selectedSnapshot && previousSnapshot
    ? computeDiff(previousSnapshot.state, selectedSnapshot.state)
    : null

  return (
    <div className="state-diff-viewer">
      <div className="diff-header">
        <h2>State Diff Viewer</h2>
        <span>
          {selectedSnapshot
            ? `Comparing with ${previousSnapshot ? 'previous' : 'initial'} state`
            : 'Select a snapshot to view diff'}
        </span>
      </div>

      <div className="diff-selector">
        <h3>Snapshots</h3>
        <div className="snapshot-list">
          {snapshots.map((snapshot: any, index: number) => (
            <div
              key={snapshot.timestamp}
              className={`snapshot-item ${selectedSnapshot?.timestamp === snapshot.timestamp ? 'active' : ''}`}
              onClick={() => handleSnapshotSelect(snapshot)}
            >
              <span className="snapshot-time">{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {diff && Object.keys(diff).length > 0 ? (
        <div className="diff-view">
          <h3>Differences</h3>
          <div className="diff-list">
            {Object.entries(diff).map(([key, value]: any) => (
              <div key={key} className="diff-item">
                <span className="diff-key">{key}</span>
                <div className="diff-values">
                  <div className="diff-value previous">
                    <span className="label">Previous</span>
                    <pre>{JSON.stringify(value.previous, null, 2)}</pre>
                  </div>
                  <div className="diff-value current">
                    <span className="label">Current</span>
                    <pre>{JSON.stringify(value.current, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-diff">
          {selectedSnapshot
            ? 'No state changes detected'
            : 'Select two snapshots to view differences'}
        </div>
      )}
    </div>
  )
}
