# Plugin API Reference

The Plugin API provides a powerful extension system for GridKit tables with lifecycle management, dependency resolution, and plugin isolation.

## Installation

Plugins are included in the core package. Official plugins are available separately:

```bash
# Core package (includes plugin system)
npm install @gridkit/core

# Official plugins
npm install @gridkit/plugins
```

## Quick Example

```typescript
import { createTable, PluginManager } from '@gridkit/core';
import { auditLogPlugin, analyticsPlugin } from '@gridkit/plugins';

const table = createTable({
  data,
  columns,
  features: {
    plugins: [
      auditLogPlugin({
        destination: '/api/audit',
        events: ['row:create', 'row:update', 'row:delete'],
      }),
      analyticsPlugin({
        provider: 'mixpanel',
        autoTrack: true,
      }),
    ],
  },
});
```

---

## Plugin Interface

All plugins must implement the `Plugin` interface.

### Plugin Definition

```typescript
interface Plugin<TConfig = Record<string, unknown>> {
  // Metadata
  readonly metadata: PluginMetadata;
  
  // Lifecycle
  initialize(config: TConfig, context: PluginContext): Promise<void> | void;
  destroy(): Promise<void> | void;
  update?(config: Partial<TConfig>): void;
  
  // Optional capabilities
  getCapabilities?(): PluginCapability[];
  getDependencies?(): string[];
}
```

### PluginMetadata

```typescript
interface PluginMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly dependencies?: string[];
  readonly capabilities?: string[];
  readonly compatibility?: {
    gridKitVersion?: string;
    browser?: string[];
  };
}
```

### PluginContext

```typescript
interface PluginContext {
  readonly eventBus: EventBus;
  readonly table: Table<unknown>;
  readonly config: Record<string, unknown>;
  readonly metadata: PluginMetadata;
  readonly logger: Logger;
  
  // Extension points
  extendTable(extension: TableExtension): void;
  extendColumn(extension: ColumnExtension): void;
  extendRow(extension: RowExtension): void;
  
  // Utilities
  getPlugin<T extends Plugin>(id: string): T | undefined;
  registerUtility<T>(name: string, utility: T): void;
  getUtility<T>(name: string): T | undefined;
}
```

### Example Plugin

```typescript
import type { Plugin, PluginMetadata, PluginContext } from '@gridkit/core';

interface LoggingPluginConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  destination: 'console' | 'file' | 'remote';
  remoteUrl?: string;
}

class LoggingPlugin implements Plugin<LoggingPluginConfig> {
  readonly metadata: PluginMetadata = {
    id: 'logging-plugin',
    name: 'Logging Plugin',
    version: '1.0.0',
    description: 'Logs table events to configured destination',
    author: 'GridKit Team',
    license: 'MIT',
  };

  private config!: LoggingPluginConfig;
  private context!: PluginContext;
  private unsubscribe: (() => void) | null = null;

  async initialize(config: LoggingPluginConfig, context: PluginContext): Promise<void> {
    this.config = config;
    this.context = context;

    // Subscribe to events
    this.unsubscribe = context.eventBus.on('*', (event) => {
      this.log(event.type, event.payload);
    });

    this.context.logger.info('Logging plugin initialized');
  }

  private log(eventType: string, payload: unknown): void {
    const message = `[${eventType}] ${JSON.stringify(payload)}`;
    
    switch (this.config.level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
    }
  }

  async destroy(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.context.logger.info('Logging plugin destroyed');
  }

  update(config: Partial<LoggingPluginConfig>): void {
    this.config = { ...this.config, ...config };
    this.context.logger.info('Logging plugin config updated');
  }
}
```

---

## PluginManager

Central management for plugin lifecycle.

### Creating a PluginManager

```typescript
import { PluginManager } from '@gridkit/core';

const pluginManager = new PluginManager({
  debug: true,
  timeout: 30000, // 30 second timeout for plugin operations
});
```

### Methods

#### register()

Register a plugin with the manager.

```typescript
register<TConfig>(plugin: Plugin<TConfig>): void;
```

**Example:**
```typescript
const plugin = new LoggingPlugin();
pluginManager.register(plugin);
```

#### initializePlugin()

Initialize a registered plugin.

```typescript
initializePlugin<TConfig>(
  pluginId: string,
  config: TConfig
): Promise<void>;
```

**Example:**
```typescript
await pluginManager.initializePlugin('logging-plugin', {
  level: 'info',
  destination: 'console',
});
```

#### destroyPlugin()

Destroy an initialized plugin.

```typescript
destroyPlugin(pluginId: string): Promise<void>;
```

**Example:**
```typescript
await pluginManager.destroyPlugin('logging-plugin');
```

#### updatePlugin()

Update plugin configuration.

```typescript
updatePlugin<TConfig>(
  pluginId: string,
  config: Partial<TConfig>
): void;
```

**Example:**
```typescript
pluginManager.updatePlugin('logging-plugin', {
  level: 'debug',
});
```

#### getPlugin()

Get a plugin by ID.

```typescript
getPlugin<T extends Plugin>(pluginId: string): T | undefined;
```

#### getPlugins()

Get all registered plugins.

```typescript
getPlugins(): Plugin[];
```

#### isInitialized()

Check if a plugin is initialized.

```typescript
isInitialized(pluginId: string): boolean;
```

#### listPlugins()

List all plugins with their status.

```typescript
listPlugins(): PluginStatus[];
```

**Returns:**
```typescript
interface PluginStatus {
  id: string;
  name: string;
  version: string;
  status: 'registered' | 'initialized' | 'error' | 'destroyed';
  error?: Error;
}
```

---

## Plugin Isolation

Plugins run in isolated contexts to prevent interference.

### Event Isolation

Each plugin gets its own event bus scope.

```typescript
class MyPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    // Events are scoped to this plugin
    context.eventBus.on('row:select', (event) => {
      // Only receives events this plugin subscribed to
    });

    // Emit plugin-scoped events
    context.eventBus.emit('my-plugin:ready', { pluginId: context.metadata.id });
  }
}
```

### Error Isolation

Plugin errors don't crash the table.

```typescript
// Plugin errors are caught and logged
class FaultyPlugin implements Plugin {
  async initialize(): Promise<void> {
    throw new Error('Plugin initialization failed');
  }
}

// Table continues working, plugin status is 'error'
await pluginManager.initializePlugin('faulty-plugin', {});
// Status: { id: 'faulty-plugin', status: 'error', error: Error(...) }
```

### Resource Quotas

Limit plugin resource usage.

```typescript
import { QuotaManager } from '@gridkit/core';

const quotaManager = new QuotaManager({
  maxMemory: 100 * 1024 * 1024, // 100MB
  maxCpuTime: 5000, // 5 seconds
  maxEventListeners: 100,
});

class MyPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    // Check quota before heavy operation
    const quota = quotaManager.getQuota(context.metadata.id);
    
    if (quota.memoryRemaining < 10 * 1024 * 1024) {
      throw new Error('Memory quota exceeded');
    }
  }
}
```

---

## Plugin Dependencies

Plugins can declare dependencies on other plugins.

### Declaring Dependencies

```typescript
class DependentPlugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: 'dependent-plugin',
    name: 'Dependent Plugin',
    version: '1.0.0',
    dependencies: ['logging-plugin', 'analytics-plugin'],
  };

  async initialize(config: unknown, context: PluginContext): Promise<void> {
    // Access dependent plugins
    const loggingPlugin = context.getPlugin('logging-plugin');
    const analyticsPlugin = context.getPlugin('analytics-plugin');
    
    // Use their capabilities
    if (loggingPlugin) {
      // Interact with logging plugin
    }
  }
}
```

### Dependency Resolution

Plugins are initialized in dependency order.

```typescript
// Register in any order
pluginManager.register(loggingPlugin);
pluginManager.register(analyticsPlugin);
pluginManager.register(dependentPlugin);

// Initialize - dependencies resolved automatically
await pluginManager.initializePlugin('dependent-plugin', {});
// Initializes in order: logging -> analytics -> dependent
```

### Optional Dependencies

```typescript
class OptionalPlugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: 'optional-plugin',
    name: 'Optional Plugin',
    version: '1.0.0',
    dependencies: ['logging-plugin?'], // Optional dependency
  };

  async initialize(config: unknown, context: PluginContext): Promise<void> {
    const loggingPlugin = context.getPlugin('logging-plugin');
    
    if (loggingPlugin) {
      // Use logging if available
    } else {
      // Fallback behavior
    }
  }
}
```

---

## Plugin Communication

Plugins can communicate through various mechanisms.

### Cross-Plugin Bridge

```typescript
import { CrossPluginBridge } from '@gridkit/core';

class SenderPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    const bridge = new CrossPluginBridge(context);
    
    // Send message to another plugin
    bridge.send('receiver-plugin', {
      type: 'DATA_UPDATE',
      payload: { data: 'new data' },
    });
  }
}

class ReceiverPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    const bridge = new CrossPluginBridge(context);
    
    // Listen for messages
    bridge.on('DATA_UPDATE', (message) => {
      console.log('Received:', message.payload);
    });
  }
}
```

### Shared State

```typescript
class SharedStatePlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    // Register shared utility
    context.registerUtility('shared-cache', new Map());
  }
}

class ConsumerPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    // Access shared utility
    const cache = context.getUtility<Map>('shared-cache');
    
    if (cache) {
      cache.set('key', 'value');
    }
  }
}
```

### Events

```typescript
// Plugin A emits
context.eventBus.emit('plugin-a:data-ready', { data });

// Plugin B listens
context.eventBus.on('plugin-a:data-ready', (event) => {
  console.log('Received data:', event.payload);
});
```

---

## Extension Points

Plugins can extend table, column, and row functionality.

### Table Extensions

```typescript
class ExportPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    context.extendTable({
      id: 'export',
      methods: {
        exportToCSV(options?: ExportOptions): string {
          // Implementation
          return csvContent;
        },
        exportToExcel(options?: ExportOptions): Blob {
          // Implementation
          return excelBlob;
        },
        exportToPDF(options?: ExportOptions): Blob {
          // Implementation
          return pdfBlob;
        },
      },
    });
  }
}

// Usage
const csv = table.exportToCSV();
const excel = table.exportToExcel({ includeFormatting: true });
```

### Column Extensions

```typescript
class FormatPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    context.extendColumn({
      id: 'format',
      properties: {
        format?: 'currency' | 'percentage' | 'date' | 'number';
        formatOptions?: Record<string, unknown>;
      },
      methods: {
        getFormattedValue(): string {
          // Implementation
          return formattedValue;
        },
      },
    });
  }
}

// Usage in column definition
const column: ColumnDef<User> = {
  accessorKey: 'salary',
  format: 'currency',
  formatOptions: { currency: 'USD', decimals: 2 },
};
```

### Row Extensions

```typescript
class ValidationPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    context.extendRow({
      id: 'validation',
      methods: {
        async validate(): Promise<ValidationResult> {
          // Implementation
          return result;
        },
        getErrors(): ValidationError[] {
          // Implementation
          return errors;
        },
        isValid(): boolean {
          // Implementation
          return errors.length === 0;
        },
      },
    });
  }
}

// Usage
const row = table.getRowModel().rows[0];
const result = await row.validate();
if (!result.valid) {
  console.log(row.getErrors());
}
```

---

## Official Plugins

### Audit Log Plugin

```typescript
import { auditLogPlugin } from '@gridkit/plugins';

table.use(auditLogPlugin({
  destination: '/api/audit',
  events: ['row:create', 'row:update', 'row:delete'],
  includeMetadata: true,
  retention: '7y',
  pii: {
    mask: ['email', 'ssn'],
    encrypt: ['salary'],
  },
}));
```

### Analytics Plugin

```typescript
import { analyticsPlugin } from '@gridkit/plugins';

table.use(analyticsPlugin({
  provider: 'mixpanel',
  apiKey: 'YOUR_API_KEY',
  autoTrack: true,
  customEvents: {
    'row:select': 'Table Row Selected',
    'filter:apply': 'Table Filter Applied',
  },
  userProperties: {
    userId: () => getCurrentUserId(),
    role: () => getUserRole(),
  },
}));
```

### Export Plugin

```typescript
import { exportPlugin } from '@gridkit/plugins';

table.use(exportPlugin({
  formats: ['csv', 'xlsx', 'pdf', 'json'],
  filename: 'table-export',
  includeFilteredOnly: true,
  includeFormatting: true,
}));

// Usage
table.exportToCSV();
table.exportToExcel({ includeCharts: true });
table.exportToPDF({ orientation: 'landscape' });
```

---

## Examples

### Creating a Custom Plugin

```typescript
import type { Plugin, PluginMetadata, PluginContext } from '@gridkit/core';

interface ToastPluginConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
  theme: 'light' | 'dark';
}

class ToastPlugin implements Plugin<ToastPluginConfig> {
  readonly metadata: PluginMetadata = {
    id: 'toast-plugin',
    name: 'Toast Notifications',
    version: '1.0.0',
    description: 'Shows toast notifications for table events',
  };

  private config!: ToastPluginConfig;

  async initialize(config: ToastPluginConfig, context: PluginContext): Promise<void> {
    this.config = config;

    // Show toast for row selection
    context.eventBus.on('row:select', (event) => {
      this.showToast(
        `Row ${event.payload.rowId} ${event.payload.selected ? 'selected' : 'deselected'}`,
        'info'
      );
    });

    // Show toast for errors
    context.eventBus.on('data:error', (event) => {
      this.showToast(`Error: ${event.payload.error.message}`, 'error');
    });
  }

  private showToast(message: string, type: 'info' | 'error' | 'success'): void {
    // Implementation using your toast library
    console.log(`[${type}] ${message}`);
  }

  async destroy(): Promise<void> {
    // Cleanup
  }
}

// Usage
const table = createTable({
  data,
  columns,
  features: {
    plugins: [
      new ToastPlugin({
        position: 'top-right',
        duration: 3000,
        theme: 'dark',
      }),
    ],
  },
});
```

### Plugin with Settings UI

```typescript
class SettingsPlugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: 'settings-plugin',
    name: 'Table Settings',
    version: '1.0.0',
  };

  async initialize(config: unknown, context: PluginContext): Promise<void> {
    // Register settings panel component
    context.extendTable({
      id: 'settings',
      methods: {
        openSettings(): void {
          // Open settings modal
        },
        saveSettings(settings: TableSettings): void {
          // Save settings
        },
        getSettings(): TableSettings {
          // Get current settings
        },
      },
    });
  }
}
```

---

## Best Practices

### 1. Keep Plugins Focused

```typescript
// ✅ Good - single responsibility
class ExportPlugin implements Plugin { /* only export */ }
class ValidationPlugin implements Plugin { /* only validation */ }

// ❌ Bad - too many responsibilities
class MegaPlugin implements Plugin { /* export + validation + analytics + ... */ }
```

### 2. Handle Errors Gracefully

```typescript
class RobustPlugin implements Plugin {
  async initialize(config: unknown, context: PluginContext): Promise<void> {
    try {
      // Initialization
    } catch (error) {
      context.logger.error('Initialization failed:', error);
      throw error; // Re-throw to prevent registration
    }
  }
}
```

### 3. Clean Up Resources

```typescript
class CleanupPlugin implements Plugin {
  private subscriptions: Array<() => void> = [];
  private intervalId: number | null = null;

  async initialize(config: unknown, context: PluginContext): Promise<void> {
    const unsubscribe = context.eventBus.on('data:change', handler);
    this.subscriptions.push(unsubscribe);

    this.intervalId = window.setInterval(() => {
      // Periodic task
    }, 5000);
  }

  async destroy(): Promise<void> {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];

    // Clear intervals
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

### 4. Use Type-Safe Configuration

```typescript
interface PluginConfig {
  enabled: boolean;
  apiUrl: string;
  timeout: number;
}

class TypedPlugin implements Plugin<PluginConfig> {
  private config!: PluginConfig;

  async initialize(config: PluginConfig, context: PluginContext): Promise<void> {
    this.config = config;
    // config is fully typed
  }
}
```

### 5. Document Plugin API

```typescript
/**
 * Audit Log Plugin
 * 
 * Records all table operations for compliance and debugging.
 * 
 * @example
 * ```typescript
 * table.use(auditLogPlugin({
 *   destination: '/api/audit',
 *   events: ['row:*'],
 * }));
 * ```
 */
class AuditLogPlugin implements Plugin { /* ... */ }
```

---

## Troubleshooting

### Plugin not initializing

**Check:**
- Plugin is registered before initialization
- All dependencies are available
- No errors in initialize() method

```typescript
try {
  await pluginManager.initializePlugin('my-plugin', config);
} catch (error) {
  console.error('Plugin initialization failed:', error);
}
```

### Plugin conflicts

**Check:**
- No duplicate plugin IDs
- Compatible plugin versions
- No circular dependencies

```typescript
// Check for conflicts
const plugins = pluginManager.listPlugins();
const ids = plugins.map(p => p.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
```

### Memory leaks

**Check:**
- All subscriptions cleaned up in destroy()
- No lingering intervals or timeouts
- Event listeners removed

```typescript
class LeakyPlugin implements Plugin {
  private intervalId: number;

  async initialize(): Promise<void> {
    this.intervalId = window.setInterval(() => { /* ... */ }, 1000);
  }

  async destroy(): Promise<void> {
    // Don't forget to clear!
    window.clearInterval(this.intervalId);
  }
}
```

---

## See Also

- [Core API](core.md) - Table creation and management
- [Events API](events.md) - Event system
- [Plugin System](../plugin-system.md) - Plugin concepts
- [Plugin Development Guide](../guides/plugin-development.md) - How to create plugins
