# CORE-006B: Plugin Configuration & Dependency Management

## 🎯 Goal

Implement type-safe plugin configuration system with dependency injection, validation, and dynamic configuration updates.

## 📋 What to implement

### 1. Configuration Management

- Type-safe configuration schemas using Zod or similar pattern
- Configuration validation at plugin registration
- Default configuration merging with user-provided config
- Configuration watchers for dynamic updates
- Configuration persistence hooks

### 2. Dependency Injection System

- Plugin dependency resolution with topological sorting
- Circular dependency detection and prevention
- Lazy dependency loading
- Optional and peer dependencies support
- Dependency version compatibility checking

### 3. Configuration Events

- `plugin:config:update` - Configuration change events
- `plugin:config:error` - Configuration validation errors
- `plugin:dependency:loaded` - Dependency loading events
- Configuration change propagation to dependent plugins

### 4. Runtime Configuration API

- `getConfig(pluginId): TConfig` - Type-safe config getter
- `updateConfig(pluginId, changes): void` - Partial updates
- `resetConfig(pluginId): void` - Reset to defaults
- `watchConfig(pluginId, callback): Unsubscribe` - Config watching

## 🚫 What NOT to do

- Do NOT implement complex configuration inheritance
- Do NOT add configuration file parsing
- Do NOT implement configuration encryption
- Do NOT add UI for configuration management
- Keep focus on runtime configuration only

## 📁 File Structure

```
packages/core/src/plugin/
├── config/
│   ├── ConfigSchema.ts     # Type-safe schema definitions
│   ├── ConfigManager.ts    # Central configuration management
│   ├── ConfigValidator.ts  # Runtime validation
│   └── ConfigWatcher.ts    # Configuration change detection
├── dependencies/
│   ├── DependencyGraph.ts  # Topological sorting & resolution
│   ├── DependencyResolver.ts
│   ├── VersionChecker.ts   # Semantic version checking
│   └── CircularDetector.ts # Circular dependency detection
├── events/
│   └── ConfigEvents.ts     # Configuration-related events
└── ConfigurablePlugin.ts   # Enhanced plugin with config support
```

## 🧪 Test Requirements

- [ ] Config validation: Invalid config rejected at registration
- [ ] Default merging: User config merges with defaults correctly
- [ ] Dependency resolution: Plugins load in correct order
- [ ] Circular detection: Circular dependencies prevented
- [ ] Config updates: Changes propagate to plugins
- [ ] Type safety: Config types preserved through runtime
- [ ] Version checking: Incompatible versions rejected
- [ ] Partial updates: updateConfig() merges changes correctly

## 💡 Implementation Example

```typescript
// config/ConfigSchema.ts
export interface ConfigSchema<T> {
  readonly defaults: T;
  readonly validate: (config: unknown) => config is T;
  readonly migrations?: ConfigMigration[];
}

export function createConfigSchema<T>(
  defaults: T,
  validator: (config: unknown) => config is T
): ConfigSchema<T> {
  return {
    defaults: Object.freeze({ ...defaults }),
    validate: validator,
  };
}

// dependencies/DependencyGraph.ts
export class DependencyGraph {
  private graph = new Map<string, Set<string>>();
  private reverseGraph = new Map<string, Set<string>>();

  addDependency(dependent: string, dependency: string): void {
    // Add to forward graph
    if (!this.graph.has(dependent)) {
      this.graph.set(dependent, new Set());
    }
    this.graph.get(dependent)!.add(dependency);

    // Add to reverse graph for circular detection
    if (!this.reverseGraph.has(dependency)) {
      this.reverseGraph.set(dependency, new Set());
    }
    this.reverseGraph.get(dependency)!.add(dependent);

    this.detectCircularDependency(dependent);
  }

  getLoadOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (node: string, path: string[] = []) => {
      if (visited.has(node)) return;
      visited.add(node);

      const dependencies = this.graph.get(node) || new Set();
      for (const dep of dependencies) {
        visit(dep, [...path, node]);
      }

      order.push(node);
    };

    for (const node of this.graph.keys()) {
      visit(node);
    }

    return order;
  }
}
```

## 🔗 Dependencies

- CORE-006A (Plugin System Foundation) - Required
- CORE-005B (Event Registry) - Required for config events
- Optional: Zod or similar for schema validation patterns

## 📊 Success Criteria

- Config validation with detailed error messages
- Dependency resolution O(n log n) complexity
- < 5ms overhead for configuration updates
- 100% type safety for configuration access
- Zero runtime type assertions in config system
- Circular dependency detection before plugin initialization
