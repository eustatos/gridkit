# @gridkit/tanstack-adapter

GridKit Enhanced adapter for TanStack Table - adds enterprise features to TanStack Table without breaking changes.

## Features

- **Zero Breaking Changes** - Preserves all TanStack Table API
- **Event-Driven** - Enhanced event system with middleware
- **Performance Monitoring** - Built-in metrics and budgets
- **Validation** - Schema-based validation with Zod
- **Plugin System** - Full plugin ecosystem
- **Debug Tools** - Time-travel debugging
- **TypeScript** - Full type safety

## Installation

```bash
npm install @gridkit/tanstack-adapter @tanstack/react-table @gridkit/core
```

## Quick Start

```tsx
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter/react'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    events: true,
    performance: true,
    validation: true
  }
})

// TanStack API still works
const rows = table.getRowModel().rows

// + GridKit features
table.on('row:select', handleSelect)
console.log(table.metrics.getStats())
```

## API

### useGridEnhancedTable

```typescript
function useGridEnhancedTable<TData extends RowData>(
  options: TableOptions<TData> & {
    features?: EnhancedTableFeatures
  }
): EnhancedTable<TData>
```

### Features

```typescript
interface EnhancedTableFeatures {
  events?: EventConfig | boolean
  performance?: PerformanceConfig | boolean
  validation?: ValidationConfig | boolean
  plugins?: Plugin[]
  debug?: DebugConfig | boolean
}
```

## Package Structure

```
packages/tanstack-adapter/
├── src/
│   ├── core/           # Core adapter logic
│   ├── react/          # React hooks
│   ├── enhancers/      # HOC enhancers
│   └── types/          # Type definitions
├── dist/               # Build output
└── package.json
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Dev mode
pnpm dev
```

## License

MIT
