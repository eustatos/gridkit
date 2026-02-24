// Type Declarations for GridKit DevTools

declare global {
  interface Window {
    __GRIDKIT_TABLES__?: Map<string, any>
    __GRIDKIT_DEVTOOLS__?: import('./DevToolsBackend').DevToolsBackend
  }
}

export {}
