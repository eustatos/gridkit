# ENT-PLUG-001: Plugin System Enhancement

**Status**: 🟢 Ready  
**Priority**: P0 - Critical  
**Estimated Effort**: 4 weeks  
**Phase**: 1 - Core Enhancement  
**Dependencies**: ENT-EVT-001 (Event System), Existing plugin system (CORE-006)

---

## Objective

Enhance the existing plugin system to provide a full-featured ecosystem with official plugins, marketplace support, plugin isolation, resource management, and hot-reload capabilities.

---

## Current State (TanStack Table)

```typescript
// ⚠️ Limited plugin system - only row models
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel()
  // Hard to add custom plugins
})
```

---

## Target State (GridKit Enhanced)

```typescript
// ✅ Full-featured plugin ecosystem
import { 
  auditLogPlugin, 
  analyticsPlugin, 
  exportPlugin 
} from '@gridkit/plugins'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    plugins: [
      auditLogPlugin({
        destination: 'api/logs',
        events: ['row:create', 'row:update', 'row:delete'],
        pii: {
          mask: ['email', 'ssn'],
          encrypt: ['salary']
        }
      }),
      
      analyticsPlugin({
        provider: 'mixpanel',
        autoTrack: true
      }),
      
      exportPlugin({
        formats: ['csv', 'xlsx', 'pdf']
      })
    ]
  }
})

// Dynamic plugin management
table.registerPlugin(customPlugin)
table.unregisterPlugin('plugin-id')
```

---

## Technical Requirements

### 1. Enhanced Plugin Interface

**File**: `packages/core/src/plugin/types/enhanced.ts`

```typescript
export interface EnhancedPlugin<TConfig = PluginConfig> extends Plugin<TConfig> {
  // Enhanced metadata
  metadata: EnhancedPluginMetadata
  
  // Lifecycle
  initialize(context: EnhancedPluginContext): Promise<void>
  destroy(): Promise<void>
  
  // Configuration
  validateConfig?(config: TConfig): ValidationResult
  getDefaultConfig?(): TConfig
  
  // Hot reload support
  onHotReload?(): Promise<void>
  
  // Health check
  healthCheck?(): Promise<PluginHealth>
  
  // Permissions
  requiredPermissions?: Permission[]
  
  // Resource limits
  resourceLimits?: ResourceLimits
}

export interface EnhancedPluginMetadata extends PluginMetadata {
  // Core metadata
  id: string
  name: string
  version: string
  author: string
  description: string
  
  // Categorization
  category: 'data' | 'ui' | 'export' | 'analytics' | 'collaboration' | 'security' | 'utility'
  tags: string[]
  
  // Compatibility
  coreVersion: string
  peerPlugins?: string[]
  incompatibleWith?: string[]
  
  // Marketplace
  homepage?: string
  repository?: string
  license: string
  pricing?: 'free' | 'freemium' | 'paid'
  
  // Quality
  verified: boolean
  featured: boolean
  downloads?: number
  rating?: number
}

export interface ResourceLimits {
  maxMemoryMB?: number
  maxCPUPercent?: number
  maxEventHandlers?: number
  maxStorageMB?: number
}
```

### 2. Enhanced Plugin Context

**File**: `packages/core/src/plugin/context/EnhancedPluginContext.ts`

```typescript
export class EnhancedPluginContext implements PluginContext {
  constructor(
    private pluginId: string,
    private table: TableInstance,
    private eventBus: EnhancedEventBus,
    private resourceMonitor: ResourceMonitor
  ) {}
  
  // Event system access
  on<T extends BaseEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): Unsubscribe
  
  emit<T extends BaseEvent>(event: T): void
  
  // Cross-plugin communication
  sendMessage(targetPlugin: string, message: any): void
  onMessage(handler: (message: any) => void): Unsubscribe
  
  // State access (controlled)
  getTableState(): Readonly<TableState>
  updateTableState(updater: (state: TableState) => TableState): void
  
  // Storage (isolated)
  storage: PluginStorage
  
  // Resource monitoring
  getResourceUsage(): ResourceUsage
  
  // Permissions
  hasPermission(permission: Permission): boolean
  requestPermission(permission: Permission): Promise<boolean>
}

export interface PluginStorage {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  delete(key: string): void
  clear(): void
  keys(): string[]
}
```

### 3. Plugin Manager Enhancement

**File**: `packages/core/src/plugin/manager/EnhancedPluginManager.ts`

```typescript
export class EnhancedPluginManager extends SandboxedPluginManager {
  private marketplace: PluginMarketplace
  private registry: EnhancedPluginRegistry
  
  // Installation
  async installPlugin(
    source: string | EnhancedPlugin,
    config?: PluginConfig
  ): Promise<void>
  
  async uninstallPlugin(pluginId: string): Promise<void>
  
  // Updates
  async updatePlugin(pluginId: string, version?: string): Promise<void>
  
  async checkUpdates(): Promise<PluginUpdate[]>
  
  // Discovery
  async searchPlugins(query: PluginSearchQuery): Promise<EnhancedPlugin[]>
  
  async getPlugin(pluginId: string): Promise<EnhancedPlugin | undefined>
  
  async listPlugins(filter?: PluginFilter): Promise<EnhancedPlugin[]>
  
  // Categories
  async getPluginsByCategory(category: string): Promise<EnhancedPlugin[]>
  
  async getFeaturedPlugins(): Promise<EnhancedPlugin[]>
  
  // Health
  async checkPluginHealth(pluginId: string): Promise<PluginHealth>
  
  async checkAllHealth(): Promise<Map<string, PluginHealth>>
  
  // Hot reload
  async reloadPlugin(pluginId: string): Promise<void>
  
  enableHotReload(pluginId: string): void
  disableHotReload(pluginId: string): void
}
```

### 4. Plugin Marketplace

**File**: `packages/core/src/plugin/marketplace/PluginMarketplace.ts`

```typescript
export class PluginMarketplace {
  constructor(private config: MarketplaceConfig) {}
  
  // Discovery
  async search(query: PluginSearchQuery): Promise<PluginSearchResult>
  
  async getPlugin(pluginId: string): Promise<MarketplacePlugin>
  
  async getFeatured(): Promise<MarketplacePlugin[]>
  
  async getPopular(): Promise<MarketplacePlugin[]>
  
  async getByCategory(category: string): Promise<MarketplacePlugin[]>
  
  // Installation
  async install(pluginId: string, version?: string): Promise<EnhancedPlugin>
  
  async download(pluginId: string, version?: string): Promise<Blob>
  
  // Publishing
  async publish(plugin: EnhancedPlugin, metadata: PublishMetadata): Promise<void>
  
  async update(pluginId: string, version: string): Promise<void>
  
  async unpublish(pluginId: string): Promise<void>
  
  // Analytics
  async trackDownload(pluginId: string): Promise<void>
  
  async trackRating(pluginId: string, rating: number): Promise<void>
  
  async getAnalytics(pluginId: string): Promise<PluginAnalytics>
}

export interface PluginSearchQuery {
  query?: string
  category?: string
  tags?: string[]
  verified?: boolean
  free?: boolean
  minRating?: number
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name'
  limit?: number
  offset?: number
}

export interface MarketplacePlugin extends EnhancedPlugin {
  downloadUrl: string
  changelog: string
  documentation: string
  screenshots: string[]
  demo?: string
}
```

### 5. Official Plugins

**File**: `packages/plugins/src/audit-log/index.ts`

```typescript
export const auditLogPlugin = (config: AuditLogConfig): EnhancedPlugin => ({
  metadata: {
    id: '@gridkit/plugin-audit-log',
    name: 'Audit Log Plugin',
    version: '1.0.0',
    author: 'GridKit Team',
    description: 'GDPR/HIPAA/SOX compliant audit logging',
    category: 'security',
    tags: ['audit', 'compliance', 'security'],
    coreVersion: '^1.0.0',
    license: 'MIT',
    pricing: 'free',
    verified: true,
    featured: true
  },
  
  async initialize(context) {
    // Setup audit logging
    context.on('row:create', (event) => {
      this.logEvent('CREATE', event)
    })
    
    context.on('row:update', (event) => {
      this.logEvent('UPDATE', event)
    })
    
    context.on('row:delete', (event) => {
      this.logEvent('DELETE', event)
    })
  },
  
  async destroy() {
    // Cleanup
  },
  
  requiredPermissions: ['state:read', 'events:subscribe'],
  
  resourceLimits: {
    maxMemoryMB: 50,
    maxEventHandlers: 10
  }
})

export interface AuditLogConfig {
  destination: string | ((events: AuditEvent[]) => void)
  events: string[]
  retention?: string
  pii?: {
    mask?: string[]
    encrypt?: string[]
  }
  includeMetadata?: boolean
}
```

**File**: `packages/plugins/src/analytics/index.ts`

```typescript
export const analyticsPlugin = (config: AnalyticsConfig): EnhancedPlugin => ({
  metadata: {
    id: '@gridkit/plugin-analytics',
    name: 'Analytics Plugin',
    version: '1.0.0',
    author: 'GridKit Team',
    description: 'Track user interactions with popular analytics providers',
    category: 'analytics',
    tags: ['analytics', 'tracking', 'metrics'],
    coreVersion: '^1.0.0',
    license: 'MIT',
    pricing: 'free',
    verified: true
  },
  
  async initialize(context) {
    const tracker = createTracker(config.provider)
    
    if (config.autoTrack) {
      // Auto-track common events
      context.on('row:select', (event) => {
        tracker.track('Table Row Selected', {
          rowId: event.payload.rowId
        })
      })
      
      context.on('filter:apply', (event) => {
        tracker.track('Table Filter Applied', {
          filterCount: event.payload.filters.length
        })
      })
    }
    
    // Custom event mapping
    if (config.customEvents) {
      Object.entries(config.customEvents).forEach(([eventType, trackingName]) => {
        context.on(eventType, (event) => {
          tracker.track(trackingName, event.payload)
        })
      })
    }
  },
  
  requiredPermissions: ['events:subscribe']
})

export interface AnalyticsConfig {
  provider: 'mixpanel' | 'amplitude' | 'ga' | 'segment'
  apiKey?: string
  autoTrack?: boolean
  customEvents?: Record<string, string>
}
```

**File**: `packages/plugins/src/export/index.ts`

```typescript
export const exportPlugin = (config: ExportConfig): EnhancedPlugin => ({
  metadata: {
    id: '@gridkit/plugin-export',
    name: 'Export Plugin',
    version: '1.0.0',
    author: 'GridKit Team',
    description: 'Export table data to CSV, Excel, PDF',
    category: 'export',
    tags: ['export', 'csv', 'excel', 'pdf'],
    coreVersion: '^1.0.0',
    license: 'MIT',
    pricing: 'free',
    verified: true
  },
  
  async initialize(context) {
    // Add export methods to table instance
    context.registerMethod('export', async (format, options) => {
      const state = context.getTableState()
      const data = config.includeFilteredOnly 
        ? state.filteredRows 
        : state.data
      
      switch (format) {
        case 'csv':
          return exportToCSV(data, options)
        case 'xlsx':
          return exportToExcel(data, options)
        case 'pdf':
          return exportToPDF(data, options)
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    })
  },
  
  requiredPermissions: ['state:read', 'methods:register']
})

export interface ExportConfig {
  formats: ('csv' | 'xlsx' | 'pdf' | 'json')[]
  includeFilteredOnly?: boolean
  includeFormatting?: boolean
}
```

### 6. Hot Reload Support

**File**: `packages/core/src/plugin/hot-reload/HotReloadManager.ts`

```typescript
export class HotReloadManager {
  private watchers: Map<string, FileWatcher> = new Map()
  
  enableHotReload(pluginId: string, pluginPath: string): void {
    const watcher = watch(pluginPath, async (event) => {
      if (event === 'change') {
        await this.reloadPlugin(pluginId)
      }
    })
    
    this.watchers.set(pluginId, watcher)
  }
  
  disableHotReload(pluginId: string): void {
    const watcher = this.watchers.get(pluginId)
    if (watcher) {
      watcher.close()
      this.watchers.delete(pluginId)
    }
  }
  
  private async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = await this.loadPlugin(pluginId)
    
    // Call plugin's hot reload hook
    if (plugin.onHotReload) {
      await plugin.onHotReload()
    }
    
    // Re-initialize
    await plugin.initialize(this.context)
    
    console.log(`[HotReload] Plugin ${pluginId} reloaded`)
  }
}
```

---

## Implementation Plan

### Step 1: Enhanced Plugin Interface
- [ ] Define enhanced plugin interface
- [ ] Add metadata extensions
- [ ] Add resource limits
- [ ] Add permissions
- [ ] Write type tests

### Step 2: Enhanced Context
- [ ] Extend plugin context
- [ ] Add cross-plugin messaging
- [ ] Add isolated storage
- [ ] Add resource monitoring
- [ ] Write tests

### Step 3: Manager Enhancement
- [ ] Extend plugin manager
- [ ] Add install/uninstall
- [ ] Add update checking
- [ ] Add health checks
- [ ] Write tests

### Step 4: Marketplace Infrastructure
- [ ] Create marketplace API
- [ ] Add search functionality
- [ ] Add publishing support
- [ ] Add analytics
- [ ] Write tests

### Step 5: Official Plugins
- [ ] Implement audit log plugin
- [ ] Implement analytics plugin
- [ ] Implement export plugin
- [ ] Write plugin tests
- [ ] Create plugin docs

### Step 6: Hot Reload
- [ ] Implement hot reload manager
- [ ] Add file watching
- [ ] Add reload hooks
- [ ] Write tests

### Step 7: Integration
- [ ] Integrate with table factory
- [ ] Add plugin configuration
- [ ] Update event system integration
- [ ] Write integration tests

### Step 8: Documentation
- [ ] Plugin development guide
- [ ] Plugin API reference
- [ ] Official plugins docs
- [ ] Publishing guide
- [ ] Best practices

---

## Testing Strategy

### Unit Tests

```typescript
describe('EnhancedPluginManager', () => {
  it('should install plugin', async () => {
    const manager = new EnhancedPluginManager()
    
    await manager.installPlugin(auditLogPlugin({ 
      destination: 'api/logs' 
    }))
    
    expect(manager.getPlugin('@gridkit/plugin-audit-log')).toBeDefined()
  })
  
  it('should check plugin health', async () => {
    const manager = new EnhancedPluginManager()
    await manager.installPlugin(testPlugin)
    
    const health = await manager.checkPluginHealth('test-plugin')
    
    expect(health.status).toBe('healthy')
  })
  
  it('should handle hot reload', async () => {
    const manager = new EnhancedPluginManager()
    await manager.installPlugin(testPlugin)
    
    const reloadSpy = vi.fn()
    testPlugin.onHotReload = reloadSpy
    
    manager.enableHotReload('test-plugin')
    
    // Trigger file change
    await triggerFileChange('test-plugin.js')
    
    expect(reloadSpy).toHaveBeenCalled()
  })
})
```

### Integration Tests

```typescript
describe('Plugin Integration', () => {
  it('should work with official plugins', async () => {
    const table = createTable({
      data,
      columns,
      features: {
        plugins: [
          auditLogPlugin({
            destination: mockLogger
          }),
          analyticsPlugin({
            provider: 'mixpanel',
            autoTrack: true
          })
        ]
      }
    })
    
    // Trigger event
    table.selectRow(0)
    
    // Verify audit log
    expect(mockLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SELECT',
        rowId: expect.any(String)
      })
    )
    
    // Verify analytics
    expect(mockAnalytics.track).toHaveBeenCalledWith(
      'Table Row Selected',
      expect.any(Object)
    )
  })
})
```

---

## Performance Requirements

- **Plugin load time**: < 50ms
- **Hot reload**: < 100ms
- **Cross-plugin message**: < 1ms
- **Health check**: < 10ms
- **Marketplace search**: < 200ms
- **Memory overhead per plugin**: < 5MB

---

## Success Criteria

- ✅ Enhanced plugin interface implemented
- ✅ Plugin manager fully functional
- ✅ Marketplace infrastructure operational
- ✅ 3+ official plugins released
- ✅ Hot reload working in dev mode
- ✅ Resource limits enforced
- ✅ All tests passing (>95% coverage)
- ✅ Plugin development docs complete

---

## Official Plugins Roadmap

### Phase 1 (Launch)
- ✅ Audit Log Plugin
- ✅ Analytics Plugin
- ✅ Export Plugin

### Phase 2 (Post-Launch)
- 🔄 Collaboration Plugin
- 🔄 Access Control Plugin
- 🔄 Offline Plugin

### Phase 3 (Expansion)
- 📝 AI Assistant Plugin
- 📝 Advanced Search Plugin
- 📝 Custom Themes Plugin

---

## Files to Create/Modify

### New Files
- `packages/core/src/plugin/types/enhanced.ts`
- `packages/core/src/plugin/context/EnhancedPluginContext.ts`
- `packages/core/src/plugin/manager/EnhancedPluginManager.ts`
- `packages/core/src/plugin/marketplace/PluginMarketplace.ts`
- `packages/core/src/plugin/hot-reload/HotReloadManager.ts`
- `packages/plugins/package.json` (new package)
- `packages/plugins/src/audit-log/index.ts`
- `packages/plugins/src/analytics/index.ts`
- `packages/plugins/src/export/index.ts`
- `packages/core/src/plugin/__tests__/enhanced.test.ts`

### Modified Files
- `packages/core/src/plugin/index.ts` (exports)
- `packages/core/src/table/factory/create-table.ts` (plugin integration)
- `pnpm-workspace.yaml` (add plugins package)

---

## References

- [Plugin System](../../packages/core/src/plugin/README.md)
- [Plugin Documentation](../../packages/core/src/plugin/docs/README.md)
- [Complementary Benefits](../../docs/COMPLEMENTARY_SOLUTION_BENEFITS.md)

---

**Author**: GridKit Team  
**Created**: 2026-02-23  
**Last Updated**: 2026-02-23
