# @gridkit/core

> Core table functionality for GridKit

## Status

🚧 **Work in Progress** - Phase 1 Foundation

## Installation

```bash
npm install @gridkit/core
# or
pnpm add @gridkit/core
```

## Features (Planned)

- ✅ Type-safe table management
- ✅ Immutable state management
- ✅ Column system with type inference
- ✅ Plugin system foundation
- ⏳ Virtual scrolling (Phase 2)
- ⏳ Sorting & filtering (Phase 2)

## Quick Start

```typescript
import { createTable } from '@gridkit/core';

// Coming soon...
```

## Plugin System

GridKit includes a powerful plugin system for extending functionality:

### Core Concepts

- **PluginManager**: Centralized plugin management
- **Type-safe Registry**: Compile-time plugin discovery
- **Event Integration**: Plugin-scoped event buses
- **Lifecycle Management**: Initialize/destroy with dependency resolution

### Basic Usage

```typescript
import { PluginManager } from '@gridkit/core';

// Create plugin manager
const pluginManager = new PluginManager();

// Register plugin
pluginManager.register(myPlugin);

// Initialize plugin
await pluginManager.initializePlugin('my-plugin', config);

// Update plugin
pluginManager.updatePlugin('my-plugin', newConfig);

// Destroy plugin
await pluginManager.destroyPlugin('my-plugin');
```

## Documentation

See [docs](../../docs/) for complete documentation.

## License

MIT