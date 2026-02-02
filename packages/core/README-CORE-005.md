# Core API Module - GridKit

## Overview

The Core API module provides foundational services for managing context, configuration, and data providers in GridKit. This module implements the core functionality specified in task CORE-005.

## Installation

```bash
npm install @gridkit/core
# or
yarn add @gridkit/core
# or
pnpm add @gridkit/core
```

## Modules

### 1. Context Management

Manages contextual information for table operations including user input, API responses, and system metadata.

#### Features
- Priority-based context aggregation
- Automatic cleanup of expired contexts
- Size and count limits
- Type-safe context entries
- Event subscription system

#### Usage
```typescript
import { 
  ContextManager, 
  ContextType, 
  ContextLimitError 
} from '@gridkit/core';

// Create context manager with custom rules
const contextManager = new ContextManager({
  maxEntries: 100,
  maxTotalSize: 10 * 1024 * 1024, // 10MB
  maxEntrySize: 1 * 1024 * 1024, // 1MB
  autoCleanupExpired: true,
});

// Add context entries
contextManager.addContext({
  id: 'user-input-1',
  type: ContextType.USER_INPUT,
  content: 'User entered search query',
  priority: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Get aggregated context
const aggregated = contextManager.getEffectiveContext({
  minPriority: 0,
  includeMetadata: true,
  maxOutputSize: 5000,
});

console.log(aggregated.content);
console.log(`Included ${aggregated.includedCount} contexts`);

// Subscribe to changes
const unsubscribe = contextManager.subscribe((contextId, action) => {
  console.log(`Context ${contextId} was ${action}`);
});

// Cleanup when done
unsubscribe();
```

### 2. Configuration Management

Loads, validates, and manages application configuration from multiple sources.

#### Features
- Multi-source configuration (files, env vars, runtime)
- Schema validation with Zod
- Hot reload support
- Type-safe access with dot notation
- Merge strategies

#### Usage
```typescript
import { 
  ConfigManager, 
  ConfigSource,
  DEFAULT_CONFIG 
} from '@gridkit/core';

// Create config manager
const configManager = new ConfigManager({
  watchFile: true,
  envPrefix: 'GRIDKIT_',
  defaults: {
    debug: process.env.NODE_ENV === 'development',
  },
});

// Load configuration from all sources
await configManager.load();

// Get configuration values
const debug = configManager.get<boolean>('debug');
const logLevel = configManager.get<string>('logging.level');

// Set configuration values
configManager.set('debug', true);
configManager.set('logging.level', 'debug');

// Merge new configuration
configManager.merge({
  performance: {
    enabled: true,
    sampleRate: 0.5,
  },
});

// Save to file
configManager.saveToFile('./gridkit.config.json');

// Subscribe to changes
configManager.subscribe('config:updated', (config) => {
  console.log('Configuration updated:', config);
});
```

### 3. Provider Management

Manages data providers with registry pattern, caching, and lifecycle management.

#### Features
- Dynamic provider registration
- Caching with TTL and size limits
- Authentication support
- Request retry and timeout
- Statistics and monitoring

#### Usage
```typescript
import { 
  ProviderManager,
  StaticProvider,
  type ProviderConfig 
} from '@gridkit/core';

// Create provider manager
const providerManager = new ProviderManager({
  validateOnRegister: true,
  initializeOnRegister: false,
});

// Register provider types
providerManager.registerProvider('static', StaticProvider);

// Create provider instance
const providerConfig: ProviderConfig = {
  type: 'static',
  options: {
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 10 * 1024 * 1024, // 10MB
    strategy: 'memory',
  },
};

const userProvider = providerManager.createProvider('users', providerConfig, true);

// Load data
const result = await providerManager.loadData('users', {
  pagination: { page: 1, pageSize: 10 },
  sorting: [{ columnId: 'name', direction: 'asc' }],
  filters: [{ columnId: 'email', operator: 'contains', value: 'example' }],
});

console.log(result.data);
console.log(`Total: ${result.total}`);

// Save data
await providerManager.saveData('users', [
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
]);

// Get provider statistics
const stats = providerManager.getStats();
console.log(stats);

// Dispose providers
await providerManager.disposeAll();
```

## Integration Example

```typescript
import {
  ContextManager,
  ConfigManager,
  ProviderManager,
  StaticProvider,
  ContextType,
} from '@gridkit/core';

async function initializeApp() {
  // Initialize managers
  const configManager = new ConfigManager();
  await configManager.load();
  
  const contextManager = new ContextManager({
    maxEntries: configManager.get<number>('context.maxEntries'),
    maxTotalSize: configManager.get<number>('context.maxTotalSize'),
  });
  
  const providerManager = new ProviderManager();
  providerManager.registerProvider('static', StaticProvider);
  
  // Create providers from configuration
  const providerConfigs = configManager.get<any[]>('providers') || [];
  
  for (const [name, config] of Object.entries(providerConfigs)) {
    providerManager.createProvider(name, config);
  }
  
  // Add startup context
  contextManager.addContext({
    id: 'app-startup',
    type: ContextType.METADATA,
    content: 'Application initialized successfully',
    priority: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return {
    configManager,
    contextManager,
    providerManager,
  };
}

// Error handling example
try {
  const { contextManager } = await initializeApp();
  
  // Get aggregated context for AI processing
  const context = contextManager.getEffectiveContext({
    minPriority: 5,
    includeMetadata: true,
  });
  
  console.log('Available context:', context.content);
  
} catch (error) {
  console.error('Failed to initialize:', error);
}
```

## API Reference

### ContextManager

#### Methods
- `addContext(entry, options)` - Add context with validation
- `getContext(id)` - Get context by ID
- `listContexts(filter?)` - List contexts with optional filtering
- `updateContext(id, updates)` - Update context metadata
- `removeContext(id)` - Remove context by ID
- `clear()` - Remove all contexts
- `getEffectiveContext(options)` - Get aggregated context
- `validateAll()` - Validate all contexts
- `cleanupExpired()` - Remove expired contexts
- `getStats()` - Get statistics
- `getTotalSize()` - Get total size in bytes
- `getCount()` - Get number of contexts
- `subscribe(listener)` - Subscribe to changes

### ConfigManager

#### Methods
- `load()` - Load configuration from all sources
- `reload()` - Reload configuration
- `get(key)` - Get configuration value
- `set(key, value)` - Set configuration value
- `has(key)` - Check if configuration has key
- `getAll()` - Get all configuration
- `validate()` - Validate configuration
- `merge(newConfig, strategy)` - Merge configuration
- `saveToFile(path, format)` - Save to file
- `subscribe(event, listener)` - Subscribe to events
- `destroy()` - Cleanup resources
- `getSource(key)` - Get source of configuration value
- `getRawSources()` - Get raw configuration from sources

### ProviderManager

#### Methods
- `registerProvider(type, providerClass)` - Register provider type
- `createProvider(name, config, initialize?)` - Create provider instance
- `getProvider(name)` - Get provider by name
- `getOrCreateProvider(name, config)` - Get or create provider
- `loadData(providerName, options)` - Load data through provider
- `saveData(providerName, data, options)` - Save data through provider
- `listProviderTypes()` - List registered provider types
- `listProviders()` - List created provider instances
- `validateProviderConfig(config)` - Validate provider configuration
- `updateProviderConfig(name, updates)` - Update provider configuration
- `disposeProvider(name)` - Dispose provider
- `disposeAll()` - Dispose all providers
- `getStats()` - Get statistics for all providers

## Performance Requirements

- `ContextManager.getEffectiveContext`: < 50ms для 50 контекстов
- `ConfigManager.get` с dot-notation: < 5ms
- `ProviderManager.createPlan`: < 100ms для 100 задач с зависимостями
- `ProviderManager.executePlan`: обработка 10 задач/сек
- Нет memory leaks при работе с контекстом

## Error Handling

Все модули используют единую систему ошибок с кодами:

### Context Errors
- `CONTEXT_SIZE_LIMIT` - Превышен размер контекста
- `CONTEXT_COUNT_LIMIT` - Превышено количество контекстов
- `CONTEXT_VALIDATION_FAILED` - Ошибка валидации контекста
- `CONTEXT_NOT_FOUND` - Контекст не найден
- `CONTEXT_EXPIRED` - Контекст устарел
- `CONTEXT_ALREADY_EXISTS` - Контекст уже существует

### Config Errors
- `CONFIG_LOAD_FAILED` - Ошибка загрузки конфигурации
- `CONFIG_VALIDATION_FAILED` - Ошибка валидации конфигурации
- `CONFIG_NOT_FOUND` - Конфигурация не найдена
- `CONFIG_PARSE_ERROR` - Ошибка парсинга конфигурации

### Provider Errors
- `PROVIDER_NOT_FOUND` - Провайдер не найден
- `PROVIDER_VALIDATION_FAILED` - Ошибка валидации провайдера
- `PROVIDER_LOAD_FAILED` - Ошибка загрузки данных
- `PROVIDER_INITIALIZATION_FAILED` - Ошибка инициализации провайдера
- `CIRCULAR_DEPENDENCY` - Циклическая зависимость

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Lint
npm run lint
```

## License

MIT
