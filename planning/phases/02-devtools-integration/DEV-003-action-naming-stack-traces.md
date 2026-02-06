# DEV-003: Add Action Naming and Stack Trace Support

## 🎯 Objective

Enhance the DevTools debugging experience with configurable action naming strategies and optional stack trace capture, providing developers with better context for state changes.

## 📋 Requirements

### Functional Requirements:

- [ ] Configurable action naming strategies (auto, custom, pattern-based)
- [ ] Stack trace capture in development mode only
- [ ] Configurable stack trace depth and filtering
- [ ] Source map support for readable stack traces
- [ ] Action grouping for related/batched updates
- [ ] Custom metadata attachment to actions
- [ ] Performance-optimized trace capture (lazy evaluation)
- [ ] Production build stripping of trace-related code
- [ ] Integration with existing action system

### Non-Functional Requirements:

- [ ] Stack trace overhead < 1ms per action in development
- [ ] Zero overhead in production builds
- [ ] Bundle size increase < 0.5KB (production)
- [ ] Configurable via plugin options
- [ ] Type-safe action metadata
- [ ] Framework-agnostic implementation

## 🔧 Technical Details

### Files to Create/Modify:

1. `packages/devtools/src/action-naming.ts` - Action naming strategies
2. `packages/devtools/src/stack-tracer.ts` - Stack trace capture and processing
3. `packages/devtools/src/action-metadata.ts` - Metadata management
4. `packages/devtools/src/devtools-plugin.ts` - Integration
5. `packages/devtools/src/types.ts` - Type definitions
6. `packages/core/src/types.ts` - Base action types

### Expected Architecture:

#### 1. ActionNaming System:

```typescript
export class ActionNamingSystem {
  private strategies: Map<string, ActionNamingStrategy> = new Map();

  constructor() {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    // Auto: Use atom name + operation
    this.registerStrategy("auto", (atom, value, operation) => {
      const atomName = atomRegistry.getName(atom) || atom.id.toString();
      return `${operation.toUpperCase()}_${atomName}`;
    });

    // Simple: Just operation type
    this.registerStrategy("simple", (atom, value, operation) => {
      return `${operation.toUpperCase()}_ATOM`;
    });

    // Pattern-based: User-defined pattern
    this.registerStrategy("pattern", (atom, value, operation, pattern) => {
      return pattern
        .replace("{atom}", atomRegistry.getName(atom) || "")
        .replace("{operation}", operation)
        .replace("{timestamp}", Date.now().toString());
    });
  }

  getName(
    atom: Atom<any>,
    value: any,
    operation: string,
    strategyName: string = "auto",
    options?: any,
  ): string {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown naming strategy: ${strategyName}`);
    }

    return strategy(atom, value, operation, options);
  }

  registerStrategy(name: string, strategy: ActionNamingStrategy): void {
    this.strategies.set(name, strategy);
  }
}
```

#### 2. StackTrace Capture (Development Only):

```typescript
export class StackTracer {
  private enabled: boolean;
  private maxDepth: number;
  private filterPatterns: RegExp[];

  constructor(config: StackTraceConfig = {}) {
    this.enabled = config.enabled ?? process.env.NODE_ENV !== "production";
    this.maxDepth = config.maxDepth ?? 10;
    this.filterPatterns = this.createFilterPatterns(config.filters);
  }

  capture(): string | undefined {
    if (!this.enabled) return undefined;

    try {
      const stack = new Error().stack;
      if (!stack) return undefined;

      return this.processStackTrace(stack);
    } catch (error) {
      // Fail silently in production
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to capture stack trace:", error);
      }
      return undefined;
    }
  }

  private processStackTrace(rawStack: string): string {
    const lines = rawStack.split("\n");
    const filteredLines: string[] = [];

    // Skip the first line (Error: ...)
    for (let i = 1; i < Math.min(lines.length, this.maxDepth + 1); i++) {
      const line = lines[i].trim();

      // Filter out internal/library frames if configured
      if (this.shouldIncludeLine(line)) {
        filteredLines.push(this.cleanStackTraceLine(line));
      }
    }

    return filteredLines.join("\n");
  }

  private shouldIncludeLine(line: string): boolean {
    // Skip empty lines
    if (!line) return false;

    // Apply filter patterns
    for (const pattern of this.filterPatterns) {
      if (pattern.test(line)) {
        return false;
      }
    }

    return true;
  }

  private cleanStackTraceLine(line: string): string {
    // Clean up the line for better readability
    return line
      .replace(/^at\s+/, "") // Remove "at " prefix
      .replace(/\s+\(.+\)$/, "") // Remove parentheses with location
      .trim();
  }
}
```

#### 3. Action Metadata Integration:

```typescript
export interface ActionMetadata {
  type: string;
  timestamp: number;
  source?: "component" | "hook" | "action" | "time-travel";
  stackTrace?: string;
  custom?: Record<string, any>;

  // Atom-specific metadata
  atom?: {
    id: string;
    name?: string;
    type: "primitive" | "computed" | "writable";
  };

  // Performance metadata (optional)
  performance?: {
    duration?: number;
    memoryDelta?: number;
  };
}

export class ActionMetadataBuilder {
  private namingSystem: ActionNamingSystem;
  private stackTracer: StackTracer;

  build(
    atom: Atom<any>,
    value: any,
    operation: string,
    options: ActionMetadataOptions = {},
  ): ActionMetadata {
    const metadata: ActionMetadata = {
      type: this.namingSystem.getName(
        atom,
        value,
        operation,
        options.namingStrategy,
        options.namingOptions,
      ),
      timestamp: Date.now(),
      source: options.source,
      custom: options.custom,
      atom: {
        id: atom.id.toString(),
        name: atomRegistry.getName(atom),
        type: this.getAtomType(atom),
      },
    };

    // Capture stack trace if enabled
    if (options.captureStackTrace ?? true) {
      metadata.stackTrace = this.stackTracer.capture();
    }

    // Add performance metadata if tracking enabled
    if (options.trackPerformance) {
      metadata.performance = this.capturePerformanceMetrics();
    }

    return metadata;
  }
}
```

#### 4. DevTools Plugin Integration:

```typescript
export class DevToolsPlugin implements Plugin {
  private metadataBuilder: ActionMetadataBuilder;

  constructor(config: DevToolsConfig = {}) {
    this.metadataBuilder = new ActionMetadataBuilder({
      namingStrategy: config.actionNamingStrategy,
      stackTrace: config.trace,
      maxStackTraceDepth: config.maxStackTraceDepth,
      stackTraceFilters: config.stackTraceFilters,
    });
  }

  private enhanceActionForDevTools(
    atom: Atom<any>,
    value: any,
    operation: string,
  ): any {
    const metadata = this.metadataBuilder.build(atom, value, operation, {
      source: "store",
      captureStackTrace: this.config.trace,
      namingStrategy: this.config.actionNamingStrategy,
    });

    return {
      type: metadata.type,
      payload: value,
      meta: {
        ...metadata,
        // Ensure stack trace is included in DevTools display
        stack: metadata.stackTrace,
      },
    };
  }
}
```

## 🚀 Implementation Steps

### Step 1: Implement ActionNamingSystem (2-3 hours)

1. Create base naming strategy interface
2. Implement default strategies (auto, simple, pattern)
3. Add strategy registration system
4. Write unit tests for each strategy

### Step 2: Build StackTracer with Performance (3-4 hours)

1. Implement efficient stack trace capture
2. Add stack trace filtering and cleaning
3. Implement source map support (if possible)
4. Add performance optimizations for production
5. Create development/production mode switches

### Step 3: Create ActionMetadataBuilder (2 hours)

1. Design metadata structure
2. Implement builder pattern with fluent API
3. Add type safety for custom metadata
4. Integrate with naming system and stack tracer

### Step 4: Integrate with DevTools Plugin (2 hours)

1. Modify plugin to use new metadata system
2. Add configuration options for naming and tracing
3. Ensure backward compatibility
4. Update plugin initialization

### Step 5: Add Production Optimizations (2 hours)

1. Implement tree-shaking directives
2. Add dead code elimination for stack traces
3. Create production build validation
4. Add runtime feature detection

### Step 6: Write Comprehensive Tests (3 hours)

1. Unit tests for all components
2. Integration tests with DevTools mock
3. Performance tests for stack trace capture
4. Production build verification tests

## 🧪 Testing Requirements

### Unit Tests:

- [ ] Action naming strategies produce correct names
- [ ] Stack trace capture works in development
- [ ] Stack trace filtering removes internal frames
- [ ] Metadata builder creates valid metadata
- [ ] Custom strategy registration works

### Integration Tests:

- [ ] Metadata appears correctly in DevTools
- [ ] Stack traces clickable in DevTools UI
- [ ] Production builds exclude stack trace code
- [ ] Works with all atom types

### Performance Tests:

- [ ] Stack trace capture < 1ms (development)
- [ ] Zero overhead in production builds
- [ ] Memory usage minimal for metadata storage
- [ ] No impact on store operation performance

### Edge Cases:

- [ ] Anonymous atoms (no name)
- [ ] Very deep stack traces
- [ ] Circular references in custom metadata
- [ ] Concurrent metadata building
- [ ] SSR environments (no Error.stack)

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode compliance
- [ ] No `any` types in public API
- [ ] 95%+ test coverage
- [ ] Comprehensive JSDoc with examples

### Functional:

- [ ] Configurable action naming works
- [ ] Stack traces captured in development only
- [ ] Metadata appears in DevTools UI
- [ ] Production builds have zero trace overhead
- [ ] Backward compatibility maintained

### Performance:

- [ ] Bundle size increase < 0.5KB (production)
- [ ] Stack trace overhead < 1ms (development)
- [ ] Memory overhead < 100KB per 1000 actions
- [ ] No performance regression in production

## 📝 Notes for AI

### Important Implementation Details:

1. **Production Optimization Strategy:**

```typescript
// Use conditional compilation for production
const CAPTURE_STACK_TRACES = process.env.NODE_ENV !== 'production';

export class StackTracer {
  capture(): string | undefined {
    // This entire method can be tree-shaken in production
    if (!CAPTURE_STACK_TRACES) return undefined;

    // Development-only code
    return this.captureStackTraceInternal();
  }

  // Mark as development-only for bundlers
  private captureStackTraceInternal(): string {
    if (process.env.NODE_ENV === 'production') {
      // This should never be called in production
      return '';
    }
    // Actual implementation...
  }
}

// In package.json for tree-shaking
{
  "sideEffects": false,
  "module": "dist/esm/index.js",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./package.json": "./package.json"
  }
}
```

2. **Stack Trace Filtering Patterns:**

```typescript
// Default filters to remove noise
const DEFAULT_FILTERS = [
  /node_modules/, // Library code
  /<anonymous>/, // Anonymous functions
  /nexus-state\/dist/, // Compiled library code
  /webpack\/bootstrap/, // Webpack runtime
  /Error\.captureStackTrace/, // Error class itself
];

// User can add custom filters
const config = {
  stackTraceFilters: [
    ...DEFAULT_FILTERS,
    /my-app\/utils/, // Internal utility functions
    /redux-devtools-extension/, // DevTools extension itself
  ],
};
```

3. **Action Grouping for Batched Updates:**

```typescript
export class ActionGrouper {
  private groupTimeout: number | null = null;
  private pendingActions: Array<{ atom: Atom<any>; value: any }> = [];

  groupActions(
    actions: Array<{ atom: Atom<any>; value: any }>,
    timeout: number = 16, // ~60fps
  ): Promise<ActionMetadata> {
    this.pendingActions.push(...actions);

    if (this.groupTimeout) {
      clearTimeout(this.groupTimeout);
    }

    return new Promise((resolve) => {
      this.groupTimeout = window.setTimeout(() => {
        const metadata = this.createGroupedMetadata(this.pendingActions);
        this.pendingActions = [];
        this.groupTimeout = null;
        resolve(metadata);
      }, timeout);
    });
  }

  private createGroupedMetadata(
    actions: Array<{ atom: Atom<any>; value: any }>,
  ): ActionMetadata {
    return {
      type: "BATCH_UPDATE",
      timestamp: Date.now(),
      source: "batch",
      atom: {
        id: "batch",
        name: `Batch of ${actions.length} updates`,
        type: "primitive",
      },
      custom: {
        actionCount: actions.length,
        atoms: actions.map((a) => ({
          id: a.atom.id.toString(),
          name: atomRegistry.getName(a.atom),
        })),
      },
    };
  }
}
```

### Configuration Examples:

```typescript
// Basic configuration
const plugin = new DevToolsPlugin({
  actionNamingStrategy: "auto", // or 'simple', 'pattern'
  trace: true, // Enable stack traces
  maxStackTraceDepth: 5,
  stackTraceFilters: [/node_modules/],
});

// Advanced configuration with custom strategy
const plugin = new DevToolsPlugin({
  actionNamingStrategy: "custom",
  customNaming: (atom, value, operation) => {
    // Custom naming logic
    return `[${operation}] ${atomRegistry.getName(atom)} = ${JSON.stringify(value)}`;
  },
  trace: {
    enabled: true,
    depth: 8,
    filters: [/node_modules/, /webpack/, /@myorg\/internal-lib/],
    includeSourceMaps: true,
  },
});

// Production configuration (minimal)
const plugin = new DevToolsPlugin({
  actionNamingStrategy: "simple",
  trace: false, // Disabled for zero overhead
});
```

## 🔄 Related Tasks

- **Depends on**: DEV-001, DEV-002
- **Blocks**: Phase 3 (Polish and Optimize)
- **Related**: PERF-001 (Performance optimizations)

## 🚨 Risk Assessment

| Risk                         | Probability | Impact | Mitigation                            |
| ---------------------------- | ----------- | ------ | ------------------------------------- |
| Performance overhead in dev  | Medium      | Low    | Optimized capture, configurable depth |
| Production code not stripped | Low         | High   | Build validation, tree-shaking tests  |
| Stack trace quality issues   | Medium      | Medium | Filtering, source map integration     |
| Memory leaks from metadata   | Low         | Medium | Weak references, cleanup hooks        |

---

_Task ID: DEV-003_  
_Estimated Time: 12-14 hours_  
_Priority: 🟡 Medium_  
_Status: Not Started_  
_Assigned To: AI Developer_
