# CORE-006G: Plugin Testing Utilities & Development Kit (Optional)

## Metadata

- **Task ID**: CORE-006G
- **Priority**: P3 (Optional Enhancement)
- **Estimated Time**: 3-4 hours
- **Status**: Optional
- **Dependencies**: CORE-006A, CORE-006B, CORE-005A
- **Use Case**: Plugin development, testing, quality assurance, CI/CD

## 🎯 Goal

Create comprehensive testing utilities and development tools specifically for GridKit plugins, enabling plugin authors to write robust tests, simulate environments, and ensure plugin quality.

## 📋 What TO Implement

### 1. Plugin Testing Framework

- `PluginTestHarness` - Main testing utility for plugin lifecycle testing
- `MockPluginContext` - Simulated plugin execution environment
- `EventTestingUtilities` - Tools for testing event-driven plugin behavior
- `SnapshotTesting` - Capture and compare plugin state snapshots

### 2. Mocking System

- `MockEventBus` - In-memory event bus with assertion capabilities
- `MockTableState` - Simulated table state for testing
- `MockDataProvider` - Configurable data provider for testing
- `MockUIComponents` - Mock UI components for slot testing

### 3. Development Utilities

- `PluginDevServer` - Development server with hot-reload for plugins
- `PluginLinter` - Static analysis for common plugin issues
- `PluginBundleAnalyzer` - Bundle size analysis for plugins
- `PluginTypeChecker` - TypeScript type validation utilities

### 4. Testing Assertions & Matchers

- Custom Vitest/Jest matchers for plugin assertions
- Event emission assertions (`toHaveEmittedEvent`)
- State change assertions (`toHaveUpdatedState`)
- Performance assertion helpers (`toMeetPerformanceBudget`)

### 5. CI/CD Integration

- `PluginTestRunner` - Run plugin tests in isolation
- `PluginCompatibilityChecker` - Check plugin compatibility with core versions
- `PluginBenchmark` - Performance benchmarking utilities
- `PluginSecurityScanner` - Basic security checks for plugins

## 🚫 What NOT to Implement

- ❌ NO full-featured IDE or editor
- ❌ NO complex build system (use existing tools)
- ❌ NO plugin publishing/deployment system
- ❌ NO visual design tools
- ❌ NO documentation generator (separate package)
- ❌ NO complex mocking of browser APIs

## 📁 File Structure

```
packages/core/src/plugin/testing/
├── harness/
│   ├── PluginTestHarness.ts     # Main testing utility
│   ├── MockPluginContext.ts     # Simulated execution environment
│   └── PluginTestRunner.ts      # Test runner for CI/CD
├── mocks/
│   ├── MockEventBus.ts          # Event bus for testing
│   ├── MockTableState.ts        # Table state simulation
│   └── MockUIComponents.ts      # UI component mocks
├── assertions/
│   ├── EventAssertions.ts       # Event-related assertions
│   ├── StateAssertions.ts       # State-related assertions
│   └── PerformanceAssertions.ts # Performance testing
├── utilities/
│   ├── PluginDevServer.ts       # Development server
│   ├── PluginAnalyzer.ts        # Static analysis
│   └── SnapshotManager.ts       # Snapshot testing
└── index.ts                    # Public API exports
```

## 🧪 Test Requirements (Meta-testing!)

- [ ] Test harness: Can test complete plugin lifecycle
- [ ] Mock system: All mocks behave like real implementations
- [ ] Assertions: Custom matchers work with Vitest/Jest
- [ ] Performance: Testing utilities have minimal overhead
- [ ] Isolation: Tests don't interfere with each other
- [ ] Type safety: All utilities maintain TypeScript types
- [ ] Dev server: Hot-reload works for plugin development
- [ ] CI integration: Tests can run in headless environments

## 💡 Implementation Pattern

```typescript
// harness/PluginTestHarness.ts
export class PluginTestHarness<TConfig = any> {
  private plugin: Plugin<TConfig>;
  private context: MockPluginContext;
  private eventBus: MockEventBus;

  constructor(
    pluginClass: new (context: PluginContext) => Plugin<TConfig>,
    options: TestHarnessOptions = {}
  ) {
    this.eventBus = new MockEventBus();
    this.context = new MockPluginContext({
      eventBus: this.eventBus,
      tableState: options.tableState || new MockTableState(),
      config: options.config,
    });

    this.plugin = new pluginClass(this.context);
  }

  async initialize(config?: TConfig): Promise<void> {
    await this.plugin.initialize(config || ({} as TConfig), this.context);
  }

  async destroy(): Promise<void> {
    await this.plugin.destroy();
  }

  // Event testing utilities
  getEventBus(): MockEventBus {
    return this.eventBus;
  }

  emitEventToPlugin<T extends EventType>(
    event: T,
    payload: EventPayload<T>
  ): void {
    this.eventBus.emit(event, payload, { source: 'test' });
  }

  // State inspection
  getPluginState(): unknown {
    return this.context.getPluginState?.(this.plugin.id);
  }

  // Performance testing
  async measureOperation(
    operation: () => Promise<void> | void,
    options: MeasurementOptions = {}
  ): Promise<PerformanceMeasurement> {
    const start = performance.now();
    const startMemory = this.measureMemory();

    try {
      await operation();
    } finally {
      const duration = performance.now() - start;
      const memoryDelta = this.measureMemory() - startMemory;

      if (options.assertions) {
        options.assertions(duration, memoryDelta);
      }

      return { duration, memoryDelta };
    }
  }
}

// mocks/MockEventBus.ts
export class MockEventBus extends EventBus {
  private eventHistory: Array<{ event: string; payload: unknown }> = [];
  private expectedEvents = new Map<string, ExpectedEvent[]>();

  emit<T extends EventType>(
    event: T,
    payload: EventPayload<T>,
    options?: { source?: string }
  ): void {
    super.emit(event, payload, options);

    // Record for assertions
    this.eventHistory.push({ event, payload });

    // Check expectations
    this.checkExpectations(event, payload);
  }

  // Testing utilities
  clearHistory(): void {
    this.eventHistory = [];
  }

  getEventHistory(): Array<{ event: string; payload: unknown }> {
    return [...this.eventHistory];
  }

  expectEvent<T extends EventType>(
    event: T,
    options: ExpectEventOptions = {}
  ): EventExpectation {
    const expectation: ExpectedEvent = {
      event,
      minCount: options.times?.min || 1,
      maxCount: options.times?.max || 1,
      payloadMatcher: options.payload,
      received: 0,
    };

    if (!this.expectedEvents.has(event)) {
      this.expectedEvents.set(event, []);
    }
    this.expectedEvents.get(event)!.push(expectation);

    return {
      waitFor: (timeout = 1000) =>
        this.waitForExpectation(expectation, timeout),
      assert: () => this.assertExpectation(expectation),
    };
  }

  private checkExpectations(event: string, payload: unknown): void {
    const expectations = this.expectedEvents.get(event);
    if (!expectations) return;

    for (const expectation of expectations) {
      if (this.matchesExpectation(expectation, payload)) {
        expectation.received++;
      }
    }
  }
}

// assertions/EventAssertions.ts
export function toHaveEmittedEvent(
  eventBus: MockEventBus,
  event: string,
  options: EventAssertionOptions = {}
): { pass: boolean; message: () => string } {
  const history = eventBus.getEventHistory();
  const matchingEvents = history.filter((e) => e.event === event);

  if (options.payload) {
    // Deep compare payload if provided
    matchingEvents.filter((e) => deepEqual(e.payload, options.payload));
  }

  const count = matchingEvents.length;
  const expectedCount = options.times || 1;

  return {
    pass: count === expectedCount,
    message: () =>
      `Expected event "${event}" to be emitted ${expectedCount} time(s), ` +
      `but it was emitted ${count} time(s)`,
  };
}

// Vitest/Jest integration
if (typeof expect !== 'undefined') {
  expect.extend({
    toHaveEmittedEvent(received: MockEventBus, event: string, options?: any) {
      return toHaveEmittedEvent(received, event, options);
    },
    toHavePluginState(received: PluginTestHarness, expectedState: any) {
      return toHavePluginState(received, expectedState);
    },
  });
}
```

## 🔗 Example Test

```typescript
import { PluginTestHarness } from '@gridkit/core/plugin/testing';
import { MyCustomPlugin } from './MyCustomPlugin';

describe('MyCustomPlugin', () => {
  let harness: PluginTestHarness;

  beforeEach(() => {
    harness = new PluginTestHarness(MyCustomPlugin, {
      config: { featureEnabled: true },
    });
  });

  afterEach(async () => {
    await harness.destroy();
  });

  it('should handle row selection events', async () => {
    await harness.initialize();

    const eventBus = harness.getEventBus();
    eventBus.expectEvent('row:select').assert();

    // Simulate user action
    harness.emitEventToPlugin('row:select', {
      rowId: 'row-123',
      selected: true,
    });

    // Assert plugin state changed
    expect(harness.getPluginState()).toHaveProperty('selectedRows', [
      'row-123',
    ]);
  });

  it('should meet performance budget', async () => {
    await harness.initialize();

    const measurement = await harness.measureOperation(
      async () => {
        // Simulate heavy operation
        for (let i = 0; i < 1000; i++) {
          harness.emitEventToPlugin('row:update', {
            rowId: `row-${i}`,
            changes: { value: i },
          });
        }
      },
      {
        maxDuration: 50, // 50ms budget
        maxMemory: 1024 * 1024, // 1MB memory budget
      }
    );

    expect(measurement.duration).toBeLessThan(50);
    expect(measurement.memoryDelta).toBeLessThan(1024 * 1024);
  });
});
```

## 📊 Success Criteria

- ✅ Test utilities add < 10KB to bundle (tree-shakeable)
- ✅ Plugin tests run 90% faster than integration tests
- ✅ Mock system is 100% type-safe
- ✅ Hot-reload works in < 500ms
- ✅ All utilities work in Node.js and browser
- ✅ CI integration works with major CI providers
- ✅ Memory usage stable across test runs

## 🎯 Development Workflow Enabled

1. **TDD**: Write tests first, implement plugin second
2. **Debugging**: Isolated plugin testing without full grid
3. **Benchmarking**: Performance testing for plugin operations
4. **CI/CD**: Automated plugin quality checks
5. **Documentation**: Examples serve as documentation
6. **Quality**: Enforce best practices through testing

## ⚙️ Configuration

```typescript
interface PluginTestingConfig {
  autoMock: boolean; // Auto-create mocks for dependencies
  snapshotDir: string; // Directory for snapshot files
  performanceBudgets: {
    initialization: number; // Max initialization time (ms)
    eventHandling: number; // Max event handling time (ms)
    memory: number; // Max memory increase (bytes)
  };
  ci: {
    failOnPerformance: boolean;
    generateReports: boolean;
    uploadCoverage: boolean;
  };
}
```
