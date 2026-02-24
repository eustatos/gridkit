// DevTools Panel Entry Point

import { createRoot } from 'react-dom/client'
import { DevToolsPanel } from './panel/index'

console.log('[GridKit DevTools] Panel loaded')

// Initialize React app
const root = document.getElementById('root')
if (root) {
  const app = createRoot(root)
  app.render(<DevToolsPanel />)
} else {
  console.error('[GridKit DevTools] Root element not found')
}

// Expose for debugging
window.__GRIDKIT_DEVTOOLS_PANEL__ = {
  app
}
