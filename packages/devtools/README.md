# @gridkit/devtools

Browser DevTools extension for debugging GridKit Enhanced tables.

## Features

- **Table Inspector**: View table state, columns, and rows
- **Event Timeline**: Interactive event log with filtering
- **Performance Monitor**: Real-time performance metrics
- **Time Travel**: UI controls for time-travel debugging
- **State Diff Viewer**: Visual state comparison
- **Memory Profiler**: Memory usage and leak detection
- **Plugin Inspector**: View loaded plugins and their state

## Installation

### Browser Extension

1. Clone the GridKit repository
2. Build the extension: `pnpm build:extension`
3. Load the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, and load the `extension-dist` directory
   - **Firefox**: Go to `about:debugging`, click "This Firefox", and load the temporary extension
   - **Edge**: Go to `edge://extensions/`, enable Developer mode, and load the `extension-dist` directory
   
   > Note: The built extension is located in `packages/devtools/extension-dist/` after running `pnpm build:extension`

### Package Installation

```bash
npm install @gridkit/devtools
```

## Usage

### Automatic Integration

The DevTools extension automatically detects GridKit tables on the page.

### Manual Integration

```typescript
import { useGridEnhancedTable } from '@gridkit/core'
import { useDevToolsTable } from '@gridkit/devtools'

const table = useGridEnhancedTable({
  data,
  columns,
  debug: {
    devtools: true // Enable DevTools connection
  }
})

// Automatically register with DevTools
useDevToolsTable(table)
```

### Manual Table Registration

```typescript
import { devToolsBackend } from '@gridkit/devtools'

const table = createTable({ data, columns })

// Register table with DevTools
devToolsBackend.registerTable(table)

// Unregister when done
devToolsBackend.unregisterTable(table)
```

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Primary |
| Firefox | 88+     | ✅ Supported |
| Edge    | 90+     | ✅ Supported |
| Safari  | 14+     | ⚠️ Limited (WebExtension API) |

## Development

### Build the Extension

```bash
cd packages/devtools
pnpm build:extension
```

This builds the browser extension to `extension-dist/` directory.

### Build the Package

```bash
cd packages/devtools
pnpm build
```

This builds the npm package to `dist/` directory.

### Build Both

```bash
cd packages/devtools
pnpm build:all
```

This builds both the extension and the package.

## API

### `devToolsBackend`

Global instance of `DevToolsBackend` for table registration.

#### Methods

- `registerTable(table)`: Register a table with DevTools
- `unregisterTable(table)`: Unregister a table
- `getTables()`: Get all registered tables
- `getTable(tableId)`: Get a specific table by ID

### `devToolsBridge`

Communication bridge between backend and DevTools panel.

#### Methods

- `send(message)`: Send a message to DevTools
- `sendCommand(command)`: Send a command and wait for response
- `onCommand(type, handler)`: Register a command handler
- `onResponse(handler)`: Register a response handler
- `disconnect()`: Disconnect from DevTools

### Hooks

#### `useDevToolsTable(table, enabled)`

React hook to automatically register a table with DevTools.

- `table`: The GridKit table instance
- `enabled`: Whether DevTools integration is enabled (default: true)

#### `useAutoDetectDevTools(enabled)`

React hook to automatically detect and register GridKit tables.

- `enabled`: Whether auto-detection is enabled (default: true)

## Extension Structure

### Build Output

```
packages/devtools/
├── dist/                      # NPM package build
│   ├── index.js              # Main ESM bundle
│   ├── index.cjs             # CommonJS bundle
│   ├── index.d.ts            # TypeScript definitions
│   ├── backend/              # Backend integration code
│   └── bridge/               # Communication bridge code
├── extension-dist/           # Browser extension build
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── devtools.html
│   ├── devtools.js
│   ├── panel/
│   │   ├── index.html
│   │   ├── index.js
│   │   ├── components/
│   │   └── styles/
│   └── icons/
├── extension/                # Extension source (not built)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── devtools.html
│   ├── devtools.js
│   └── panel/
├── bridge/                   # Communication bridge source
├── backend/                  # Backend integration source
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Communication Protocol

The extension uses a message-based communication protocol between the content script, background script, and DevTools panel.

### Message Types

- `BACKEND_READY`: Backend is ready to accept connections
- `CONTENT_READY`: Content script is ready
- `COMMAND`: Command from DevTools panel
- `RESPONSE`: Response to a command
- `TABLE_REGISTERED`: New table registered
- `TABLE_UNREGISTERED`: Table unregistered
- `STATE_UPDATE`: State change
- `EVENT_LOGGED`: Event logged
- `PERFORMANCE_UPDATE`: Performance metrics update
- `MEMORY_UPDATE`: Memory usage update

## Security

- All messages are validated before processing
- No external network requests
- No data collection or telemetry
- Respects Content Security Policy

## License

MIT
