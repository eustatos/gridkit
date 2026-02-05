# CORE-006F: Plugin Marketplace & Dynamic Loading (Optional)

## Metadata

- **Task ID**: CORE-006F
- **Priority**: P3 (Optional Enhancement)
- **Estimated Time**: 4-5 hours
- **Status**: Optional
- **Dependencies**: CORE-006A, CORE-006B, CORE-006C
- **Use Case**: Runtime plugin discovery, hot-swapping, plugin ecosystem

## 🎯 Goal

Implement dynamic plugin loading system with marketplace support, allowing runtime discovery, installation, and management of plugins from external sources.

## 📋 What TO Implement

### 1. Dynamic Plugin Loader

- `PluginLoader` class for loading plugins from various sources (URL, NPM, local file)
- Support for ES modules (`import()`), CommonJS, and UMD formats
- Plugin validation with signature verification (optional)
- Dependency resolution for dynamically loaded plugins
- Version compatibility checking

### 2. Plugin Registry Service

- `PluginRegistry` for discovering available plugins
- Metadata caching with TTL (time-to-live)
- Plugin search and filtering capabilities
- Categories, tags, and rating system (metadata only)
- Offline mode with local cache

### 3. Installation & Lifecycle Management

- `installPlugin(pluginId, version?): Promise<Plugin>` - Install from registry
- `uninstallPlugin(pluginId): Promise<void>` - Remove plugin
- `updatePlugin(pluginId, targetVersion): Promise<Plugin>` - Version updates
- Plugin isolation with separate execution contexts
- Rollback mechanism for failed installations

### 4. Security & Sandboxing

- Plugin signature verification (optional, requires backend)
- Resource quotas for dynamic plugins
- Network request restrictions
- Capability-based permissions for marketplace plugins
- Audit logging for all marketplace operations

### 5. Marketplace API

- `searchPlugins(query, filters): Promise<PluginMetadata[]>`
- `getPluginDetails(pluginId): Promise<PluginDetails>`
- `getPluginVersions(pluginId): Promise<VersionInfo[]>`
- Plugin ratings and reviews (storage only, UI handled elsewhere)
- Installation statistics tracking

## 🚫 What NOT to Implement

- ❌ NO payment processing or monetization
- ❌ NO user authentication/authorization system
- ❌ NO complex plugin bundling/compilation
- ❌ NO visual marketplace UI (only API)
- ❌ NO plugin hosting infrastructure
- ❌ NO real-time collaboration features

## 📁 File Structure

```
packages/core/src/plugin/marketplace/
├── loader/
│   ├── DynamicPluginLoader.ts    # Plugin loading from various sources
│   ├── ModuleResolver.ts         # ES/CJS/UMD module resolution
│   └── SecurityValidator.ts      # Plugin validation & security checks
├── registry/
│   ├── PluginRegistry.ts         # Central plugin registry
│   ├── MetadataCache.ts          # Caching with TTL
│   └── VersionManager.ts         # Version compatibility
├── installation/
│   ├── PluginInstaller.ts        # Installation/uninstallation
│   ├── DependencyResolver.ts     # Runtime dependency management
│   └── RollbackManager.ts        # Failed installation recovery
├── api/
│   ├── MarketplaceAPI.ts         # External marketplace communication
│   ├── PluginDiscovery.ts        # Plugin search & discovery
│   └── StatisticsTracker.ts      # Usage statistics
└── PluginMarketplace.ts         # Main facade class
```

## 🧪 Test Requirements

- [ ] Dynamic loading: Plugins load from URLs correctly
- [ ] Module formats: ES modules, CommonJS, UMD all work
- [ ] Dependency resolution: Dynamic dependencies install correctly
- [ ] Security: Unsafe plugins are rejected or sandboxed
- [ ] Installation: Install/update/uninstall workflows work
- [ ] Rollback: Failed installations clean up properly
- [ ] Caching: Metadata caching respects TTL
- [ ] Performance: < 500ms load time for small plugins

## 💡 Implementation Pattern

```typescript
// loader/DynamicPluginLoader.ts
export class DynamicPluginLoader {
  private importCache = new Map<string, Promise<any>>();
  private security = new SecurityValidator();

  async loadPlugin(
    source: PluginSource,
    options: LoadOptions = {}
  ): Promise<Plugin> {
    // 1. Validate source
    await this.security.validateSource(source);

    // 2. Load module based on type
    const module = await this.loadModule(source);

    // 3. Validate plugin interface
    if (!this.isValidPlugin(module)) {
      throw new PluginValidationError('Invalid plugin interface');
    }

    // 4. Create sandboxed context
    const context = this.createSandboxContext(options);

    // 5. Instantiate plugin
    const plugin = new module.default(context);

    // 6. Apply security restrictions
    this.applySecurityRestrictions(plugin, options);

    return plugin;
  }

  private async loadModule(source: PluginSource): Promise<any> {
    switch (source.type) {
      case 'url':
        return this.loadFromUrl(source.url);
      case 'npm':
        return this.loadFromNPM(source.package, source.version);
      case 'local':
        return this.loadFromLocal(source.path);
      case 'code':
        return this.evaluateCode(source.code, source.format);
    }
  }

  private async loadFromUrl(url: string): Promise<any> {
    // Use dynamic import() for ES modules
    if (url.endsWith('.mjs') || url.includes('?module')) {
      return import(/* webpackIgnore: true */ url);
    }

    // For other types, fetch and evaluate
    const response = await fetch(url);
    const code = await response.text();
    return this.evaluateCode(code, 'umd');
  }
}

// marketplace/PluginMarketplace.ts
export class PluginMarketplace {
  private registry = new PluginRegistry();
  private loader = new DynamicPluginLoader();
  private installer = new PluginInstaller();

  async search(query: SearchQuery): Promise<PluginMetadata[]> {
    // 1. Check local cache first
    const cached = this.registry.searchCache(query);
    if (cached.length > 0) {
      return cached;
    }

    // 2. Query external marketplace
    const results = await this.queryMarketplaceAPI(query);

    // 3. Cache results
    this.registry.cacheResults(query, results);

    return results;
  }

  async install(pluginId: string, version?: string): Promise<Plugin> {
    // 1. Get plugin metadata
    const metadata = await this.registry.getPluginMetadata(pluginId, version);

    // 2. Resolve dependencies
    const dependencies = await this.resolveDependencies(metadata);

    // 3. Create installation context
    const context = this.createInstallationContext(metadata);

    // 4. Install dependencies first
    for (const dep of dependencies) {
      await this.installDependency(dep, context);
    }

    // 5. Load and install main plugin
    const plugin = await this.loader.loadPlugin(metadata.source, {
      sandbox: true,
      capabilities: metadata.requiredCapabilities,
    });

    // 6. Register with plugin manager
    await this.installer.install(plugin, context);

    return plugin;
  }
}
```

## 🔗 Configuration

```typescript
interface MarketplaceConfig {
  enabled: boolean;
  registryUrl?: string; // Custom registry URL
  cacheTTL: number; // Cache time in milliseconds
  security: {
    requireSignature: boolean; // Require plugin signatures
    allowedOrigins: string[]; // Allowed plugin sources
    maxPluginSize: number; // Max plugin bundle size
    capabilityRestrictions: Record<string, string[]>;
  };
  offlineMode: boolean; // Only use cached plugins
  autoUpdate: boolean; // Auto-update plugins
}
```

## 📊 Success Criteria

- ✅ Load plugins from URL/NPM/local in < 1s
- ✅ Sandbox isolation prevents plugin interference
- ✅ Dependency resolution works for complex graphs
- ✅ Failed installations roll back completely
- ✅ Caching reduces network requests by 90%
- ✅ Memory usage < 50MB for 10 loaded plugins
- ✅ All security checks pass automated testing

## 🎯 Use Cases Supported

1. **Plugin Ecosystem**: Developers can share plugins via NPM/URL
2. **Enterprise Private Registry**: Companies host internal plugin registry
3. **Feature Flags**: Dynamically enable/disable features via plugins
4. **A/B Testing**: Load different plugin versions for different users
5. **Hot Fixes**: Deploy plugin updates without app redeployment

## ⚠️ Security Considerations

1. **Code Signing**: Optional plugin signature verification
2. **Sandboxing**: Untrusted plugins run in isolated context
3. **Capability Model**: Plugins request specific permissions
4. **Resource Limits**: Memory, CPU, network quotas
5. **Audit Trail**: All marketplace operations logged
