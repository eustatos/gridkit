// Plugin Inspector Component

import React, { useState, useEffect } from 'react'
import { devToolsBridge } from '../bridge/DevToolsBridge'

export function PluginInspector({ tableId }: { tableId: string }) {
  const [plugins, setPlugins] = useState<any[]>([])

  useEffect(() => {
    // Fetch plugins
    devToolsBridge.sendCommand({
      type: 'GET_PLUGINS',
      tableId
    }).then(setPlugins)

    // Subscribe to updates
    const unsubscribe = devToolsBridge.onResponse((response) => {
      if (response.type === 'PLUGIN_UPDATE' && response.tableId === tableId) {
        setPlugins(response.payload.plugins || [])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tableId])

  return (
    <div className="plugin-inspector">
      <div className="inspector-header">
        <h2>Plugin Inspector</h2>
        <span className="plugin-count">{plugins.length} plugins loaded</span>
      </div>

      <div className="plugins-list">
        {plugins.map((plugin: any, index: number) => (
          <div key={index} className="plugin-item">
            <div className="plugin-info">
              <span className="plugin-name">{plugin.name || 'Unknown'}</span>
              <span className="plugin-version">{plugin.version || '0.0.0'}</span>
            </div>

            <div className="plugin-state">
              <div className="state-row">
                <span className="state-label">Status:</span>
                <span className={`state-value ${plugin.status || 'unknown'}`}>
                  {plugin.status || 'unknown'}
                </span>
              </div>

              <div className="state-row">
                <span className="state-label">Priority:</span>
                <span className="state-value">{plugin.priority || 0}</span>
              </div>

              <div className="state-row">
                <span className="state-label">Dependencies:</span>
                <span className="state-value">{plugin.dependencies?.join(', ') || 'None'}</span>
              </div>
            </div>

            {plugin.config && (
              <div className="plugin-config">
                <h4>Configuration</h4>
                <pre className="json-viewer">{JSON.stringify(plugin.config, null, 2)}</pre>
              </div>
            )}

            {plugin.metadata && (
              <div className="plugin-metadata">
                <h4>Metadata</h4>
                <pre className="json-viewer">{JSON.stringify(plugin.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}

        {plugins.length === 0 && (
          <div className="empty-state">No plugins loaded</div>
        )}
      </div>
    </div>
  )
}
