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

### Column Enhancers

GridKit provides powerful column-level enhancements that extend TanStack Table's column definitions with GridKit features:

```typescript
import { 
  useGridEnhancedTable,
  composeColumnEnhancers,
  withColumnValidation,
  withColumnFormat,
  withColumnEvents,
  withColumnMetadata,
  formatters
} from '@gridkit/tanstack-adapter'
```

#### withColumnFormat

Add formatting and parsing capabilities to columns:

```typescript
import { withColumnFormat, formatters } from '@gridkit/tanstack-adapter'

const priceColumn = withColumnFormat(
  { accessorKey: 'price', header: 'Price' },
  formatters.currency(2)
)

const percentColumn = withColumnFormat(
  { accessorKey: 'completion', header: 'Progress' },
  formatters.percentage(1)
)
```

Pre-built formatters include:
- `currency(decimals, currency)` - Currency formatting
- `percentage(decimals, multiply)` - Percentage formatting  
- `date(format)` - Date formatting (ISO, YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
- `truncate(maxLength, suffix)` - Text truncation
- `uppercase()` / `lowercase()` - Case conversion
- `number(decimals, useGrouping)` - Number formatting
- `fileSize(decimals)` - File size formatting (KB, MB, GB, TB)
- `phoneNumber()` - Phone number formatting (US format)
- `boolean(trueText, falseText)` - Boolean formatting
- `capitalize()` - Capitalize first letter

#### withColumnValidation

Add validation to columns using GridKit's validation system:

```typescript
import { withColumnValidation, createSchema, field } from '@gridkit/core'

const emailColumn = withColumnValidation(
  { accessorKey: 'email', header: 'Email' },
  createSchema({
    email: field('string', {
      required: true,
      constraints: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    })
  })
)
```

#### withColumnEvents

Add event emission to columns:

```typescript
import { withColumnEvents } from '@gridkit/tanstack-adapter'

const eventfulColumn = withColumnEvents(
  { accessorKey: 'name', header: 'Name' },
  eventEmitter,
  {
    onClick: (value, row, index) => console.log('Clicked:', value),
    onEdit: (value, row, index) => console.log('Edited:', value)
  }
)
```

#### withColumnMetadata

Add metadata for UI configuration:

```typescript
import { withColumnMetadata } from '@gridkit/tanstack-adapter'

const column = withColumnMetadata(
  { accessorKey: 'price', header: 'Price' },
  {
    label: 'Product Price',
    description: 'Price in USD',
    editable: true,
    tooltip: 'Enter product price',
    icon: 'dollar-sign'
  }
)
```

#### composeColumnEnhancers

Compose multiple enhancers in a clean, functional way:

```typescript
import { 
  composeColumnEnhancers,
  withColumnValidation,
  withColumnFormat,
  formatters
} from '@gridkit/tanstack-adapter'

const enhancePrice = composeColumnEnhancers(
  (col) => withColumnValidation(col, {
    type: 'number',
    minimum: 0
  }),
  (col) => withColumnFormat(col, formatters.currency(2))
)

const enhancedColumn = enhancePrice({
  accessorKey: 'price',
  header: 'Price'
})
```

#### createEnhancedColumn

Shorthand for creating enhanced columns in one step:

```typescript
import { createEnhancedColumn, withColumnValidation, withColumnFormat, formatters } from '@gridkit/tanstack-adapter'

const enhanced = createEnhancedColumn(
  { accessorKey: 'price', header: 'Price' },
  withColumnFormat(formatters.currency(2)),
  withColumnValidation(createSchema({
    price: field('number', { minimum: 0 })
  }))
)
```

#### Complete Example

```typescript
import { 
  useGridEnhancedTable,
  composeColumnEnhancers,
  withColumnValidation,
  withColumnFormat,
  withColumnEvents,
  formatters
} from '@gridkit/tanstack-adapter'

function ProductTable() {
  const enhancePrice = composeColumnEnhancers(
    (col) => withColumnValidation(col, { type: 'number', minimum: 0 }),
    (col) => withColumnFormat(col, formatters.currency(2))
  )
  
  const enhanceEmail = composeColumnEnhancers(
    (col) => withColumnValidation(col, { 
      type: 'string', 
      constraints: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } 
    }),
    (col) => withColumnEvents(col, eventEmitter, {
      onClick: (value) => console.log('Email:', value)
    })
  )
  
  const columns = [
    { accessorKey: 'name', header: 'Name' },
    enhancePrice({ accessorKey: 'price', header: 'Price' }),
    enhanceEmail({ accessorKey: 'email', header: 'Email' })
  ]
  
  const table = useGridEnhancedTable({
    data,
    columns,
    features: { events: true, validation: true }
  })
  
  return <table>{/* ... */}</table>
}
```

## Package Structure

```
packages/tanstack-adapter/
├── src/
│   ├── core/           # Core adapter logic
│   ├── react/          # React hooks
│   ├── columns/        # Column enhancers
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
