// Time Travel Controls Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '@gridkit/devtools-bridge/DevToolsBridge'

// SVG Icons
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <rect x="4" y="4" width="16" height="16" />
  </svg>
)

export function TimeTravelControls({ tableId }: { tableId: string }) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [currentSnapshot, setCurrentSnapshot] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    // Fetch snapshots
    devToolsBridge.sendCommand({
      type: 'GET_SNAPSHOTS',
      source: 'devtools',
      tableId,
      timestamp: Date.now()
    }).then(setSnapshots)
  }, [tableId])

  const handleTravelTo = (timestamp: number) => {
    devToolsBridge.sendCommand({
      type: 'TIME_TRAVEL',
      source: 'devtools',
      tableId,
      timestamp
    })
    setCurrentSnapshot(timestamp)
  }

  const handlePlay = () => {
    setPlaying(true)
    // Implement replay logic
  }

  return (
    <div className="time-travel-controls">
      <div className="controls-header">
        <h2>Time Travel</h2>
        <div className="playback-controls">
          <button onClick={handlePlay} disabled={playing}>
            {playing ? <PauseIcon /> : <PlayIcon />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => setPlaying(false)}>
            <StopIcon />
            Stop
          </button>
        </div>
      </div>

      <div className="timeline">
        <input
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={snapshots.findIndex(s => s.timestamp === currentSnapshot) || 0}
          onChange={(e) => handleTravelTo(snapshots[parseInt(e.target.value)]?.timestamp)}
        />
      </div>

      <div className="snapshots-list">
        {snapshots.map((snapshot: any, index: number) => (
          <div
            key={snapshot.timestamp}
            className={`snapshot-item ${snapshot.timestamp === currentSnapshot ? 'active' : ''}`}
            onClick={() => handleTravelTo(snapshot.timestamp)}
          >
            <span className="snapshot-time">{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
            <span className="snapshot-state">{JSON.stringify(snapshot.state, null, 2).substring(0, 50)}...</span>
          </div>
        ))}
      </div>
    </div>
  )
}
