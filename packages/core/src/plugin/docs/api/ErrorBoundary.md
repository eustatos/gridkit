# ErrorBoundary

## Overview

`ErrorBoundary` provides error isolation for plugin event handlers. It catches errors and prevents them from affecting other plugins or the core system. Error boundaries wrap plugin functions and catch both synchronous and asynchronous errors.

## Features

- **Synchronous Error Handling**: Catch errors from synchronous functions
- **Asynchronous Error Handling**: Catch errors from async functions and promises
- **Error Callback**: Optional callback for error reporting
- **Error Context**: Add context to error messages for debugging
- **Callback Isolation**: Handle errors in the error callback itself

## Installation

```typescript
import { ErrorBoundary } from '@gridkit/plugin/security/ErrorBoundary';
```

## Usage

### Creating an Error Boundary

```typescript
import { ErrorBoundary } from '@gridkit/plugin/security/ErrorBoundary';

// Create error boundary with callback
const errorBoundary = new ErrorBoundary('plugin-1', (error, pluginId) => {
  console.error(`[${pluginId}] Error:`, error);
});

// Wrap a synchronous function
const safeFunction = errorBoundary.wrap(
  (data) => {
    // This might throw an error
    return JSON.parse(data);
  },
  'json-parse'
);

// Execute safely
safeFunction('{"key": "value"}'); // Errors are caught

// Wrap an async function
const safeAsyncFunction = errorBoundary.wrap(
  async (url) => {
    const response = await fetch(url);
    return response.json();
  },
  'api-fetch'
);

safeAsyncFunction('/api/data').catch(() => {
  // Error was caught and logged
});
```

### Without Callback

```typescript
// Create error boundary without callback
const errorBoundary = new ErrorBoundary('plugin-1');

// Wrap function
const safeHandler = errorBoundary.wrap((data) => {
  // Errors will be logged but not sent to callback
  throw new Error('Something went wrong');
});

safeHandler(); // Logs: [Plugin plugin-1] Error in undefined: Something went wrong
```

## API

### Constructor

```typescript
new ErrorBoundary(pluginId: string, onError?: (error: Error, pluginId: string) => void)
```

Creates a new error boundary for a plugin.

#### Parameters

- `pluginId` (string): The plugin identifier. Used in error messages.
- `onError` ((error: Error, pluginId: string) => void): Optional callback for handling errors. Called when an error is caught.

### Methods

#### wrap()

```typescript
wrap<T extends (...args: any[]) => any>(fn: T, context?: string): T
```

Wraps a function with error boundary protection.

**Parameters**:

- `fn` (T): The function to wrap
- `context` (string): Optional context description for error messages

**Returns**: `T` - A wrapped function that catches and handles errors

**Example**:

```typescript
// Wrap a synchronous function
const safeSync = errorBoundary.wrap(
  (data) => {
    return processData(data);
  },
  'processData'
);

// Wrap an async function
const safeAsync = errorBoundary.wrap(
  async (id) => {
    return await fetchData(id);
  },
  'fetchData'
);
```

## Error Handling

### Synchronous Errors

```typescript
const safeFunction = errorBoundary.wrap(() => {
  throw new Error('Synchronous error');
}, 'my-function');

safeFunction(); // Error is caught and logged
// Output: [Plugin plugin-1] Error in my-function: Synchronous error
```

### Asynchronous Errors

```typescript
const safeAsyncFunction = errorBoundary.wrap(async () => {
  throw new Error('Asynchronous error');
}, 'my-async-function');

safeAsyncFunction().catch((error) => {
  // Error is re-thrown after being caught by boundary
  console.log('Error caught:', error);
});
```

### Error in Callback

```typescript
const faultyCallback = (error, pluginId) => {
  throw new Error('Callback error'); // Will be caught
};

const errorBoundary = new ErrorBoundary('plugin-1', faultyCallback);

const safeFunction = errorBoundary.wrap(() => {
  throw new Error('Original error');
}, 'my-function');

safeFunction();
// Logs: [Plugin plugin-1] Error in my-function: Original error
// Logs: [Plugin plugin-1] Error in error callback: Callback error
```

## Best Practices

### 1. Always Wrap Event Handlers

```typescript
// Good
const safeHandler = errorBoundary.wrap((event) => {
  processEvent(event);
}, 'event-handler');

bus.on('my-event', safeHandler);

// Bad
bus.on('my-event', (event) => {
  processEvent(event); // No error handling!
});
```

### 2. Add Context to Wrapped Functions

```typescript
// Good - provides helpful context
const safeHandler = errorBoundary.wrap(
  (data) => {
    processData(data);
  },
  'process-data-handler'
);

// Bad - no context
const safeHandler = errorBoundary.wrap((data) => {
  processData(data);
});
```

### 3. Handle Errors Gracefully

```typescript
const safeHandler = errorBoundary.wrap(
  (data) => {
    try {
      processData(data);
    } catch (error) {
      // Log and continue
      console.error('Error processing data:', error);
      return null;
    }
  },
  'process-data'
);
```

### 4. Use Error Boundaries with Event Sandboxes

```typescript
const sandbox = new EventSandbox('plugin-1', baseBus, ['*']);
const localBus = sandbox.getBus();

const errorBoundary = new ErrorBoundary('plugin-1', (error, id) => {
  console.error(`[${id}]`, error);
});

// Wrap all handlers
localBus.on('event', errorBoundary.wrap((event) => {
  handleEvent(event);
}, 'event-handler'));
```

## Examples

### Basic Event Handler Protection

```typescript
import { ErrorBoundary } from '@gridkit/plugin/security/ErrorBoundary';

class SafePlugin {
  private errorBoundary: ErrorBoundary;

  constructor(pluginId: string) {
    this.errorBoundary = new ErrorBoundary(pluginId, (error, id) => {
      console.error(`[${id}] Plugin error:`, error);
      // Send error to monitoring service
      reportError(error, id);
    });
  }

  public registerHandlers(bus: EventBus): void {
    bus.on('data-update', this.errorBoundary.wrap((event) => {
      this.handleDataUpdate(event.payload);
    }, 'data-update'));

    bus.on('config-change', this.errorBoundary.wrap((event) => {
      this.handleConfigChange(event.payload);
    }, 'config-change'));
  }

  private handleDataUpdate(data: unknown): void {
    // Process data - errors are automatically caught
  }

  private handleConfigChange(config: unknown): void {
    // Process config - errors are automatically caught
  }
}
```

### Async Handler Protection

```typescript
import { ErrorBoundary } from '@gridkit/plugin/security/ErrorBoundary';

class AsyncPlugin {
  private errorBoundary: ErrorBoundary;

  constructor(pluginId: string) {
    this.errorBoundary = new ErrorBoundary(pluginId);
  }

  public async loadData(url: string): Promise<void> {
    const safeFetch = this.errorBoundary.wrap(
      async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      },
      'fetch-data'
    );

    try {
      const data = await safeFetch(url);
      console.log('Data loaded:', data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }
}
```

### Multiple Handlers with Same Boundary

```typescript
import { ErrorBoundary } from '@gridkit/plugin/security/ErrorBoundary';

class MultiHandlerPlugin {
  private errorBoundary: ErrorBoundary;

  constructor(pluginId: string) {
    this.errorBoundary = new ErrorBoundary(pluginId, (error, id) => {
      console.error(`[${id}]`, error);
      errorCounter.increment();
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    const handlers = [
      { event: 'user-login', handler: this.handleLogin.bind(this) },
      { event: 'user-logout', handler: this.handleLogout.bind(this) },
      { event: 'user-update', handler: this.handleUpdate.bind(this) },
    ];

    for (const { event, handler } of handlers) {
      bus.on(event, this.errorBoundary.wrap(handler, event));
    }
  }

  private handleLogin(user: User): void {
    // Error will be caught by boundary
  }

  private handleLogout(user: User): void {
    // Error will be caught by boundary
  }

  private handleUpdate(user: User): void {
    // Error will be caught by boundary
  }
}
```

## Related Documentation

- [EventSandbox](./EventSandbox.md) - Sandbox includes error handling
- [EventValidator](./EventValidator.md) - Validate events before processing
- [PluginSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [Plugin Error Handling Guide](../guides/PluginSecurityGuide.md)
