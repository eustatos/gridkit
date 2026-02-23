# ADAPTER-003: Column Enhancers

**Status**: ✅ COMPLETE  
**Priority**: P1 - Important  
**Estimated Effort**: 1 week  
**Actual Effort**: ~3 days  
**Phase**: 1 - Core Enhancement  
**Dependencies**: ADAPTER-001, ADAPTER-002  
**Completed**: 2026-02-23

---

## Objective

Create column-level enhancements that extend TanStack Table's column definitions with GridKit features like validation, formatting, events, and metadata, while maintaining full backward compatibility.

---

## Architecture

```
TanStack Column Definition
         ↓
   Column Enhancer
         ↓
Enhanced Column Definition
(TanStack + GridKit features)
```

---

## Technical Requirements

### 1. Column Enhancement Function

**File**: `packages/tanstack-adapter/src/columns/enhanceColumn.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'
import type { ValidationSchema, EventEmitter } from '@gridkit/core'

export interface EnhancedColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  // Validation
  validation?: ValidationSchema
  validateCell?: (value: TValue, row: TData) => Promise<ValidationResult>
  
  // Formatting
  format?: (value: TValue) => string
  parse?: (input: string) => TValue
  
  // Events
  onCellEdit?: (value: TValue, row: TData, rowIndex: number) => void
  onCellClick?: (value: TValue, row: TData, rowIndex: number) => void
  onCellFocus?: (value: TValue, row: TData, rowIndex: number) => void
  
  // Metadata
  meta?: {
    label?: string
    description?: string
    category?: string
    editable?: boolean
    tooltip?: string
    icon?: string
    [key: string]: any
  }
  
  // Performance
  cacheable?: boolean
  memoize?: boolean
  
  // Export
  exportable?: boolean
  exportFormat?: (value: TValue) => string
}

export function enhanceColumn<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  enhancements?: Partial<EnhancedColumnDef<TData, TValue>>
): EnhancedColumnDef<TData, TValue> {
  return {
    ...column,
    ...enhancements,
    
    // Enhance cell accessor if validation is present
    cell: (info) => {
      const baseCell = typeof column.cell === 'function' 
        ? column.cell(info) 
        : info.getValue()
      
      if (enhancements?.validation) {
        // Validate on render
        const value = info.getValue() as TValue
        enhancements.validateCell?.(value, info.row.original)
      }
      
      if (enhancements?.format) {
        return enhancements.format(info.getValue() as TValue)
      }
      
      return baseCell
    },
    
    // Add metadata
    meta: {
      ...column.meta,
      ...enhancements?.meta
    }
  }
}
```

### 2. Validation Enhancer

**File**: `packages/tanstack-adapter/src/columns/withValidation.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'
import type { ValidationSchema } from '@gridkit/core'
import { ValidationManager } from '@gridkit/core'

export interface ValidatedColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  validation: ValidationSchema
  validateCell: (value: TValue, row: TData) => Promise<ValidationResult>
}

export function withValidation<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  schema: ValidationSchema
): ValidatedColumnDef<TData, TValue> {
  const validator = new ValidationManager({ schema })
  
  return {
    ...column,
    validation: schema,
    validateCell: async (value: TValue, row: TData) => {
      return validator.validate({ [column.id || 'field']: value })
    },
    
    // Enhance cell rendering with validation feedback
    cell: (info) => {
      const baseCell = typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()
      
      const value = info.getValue() as TValue
      const isValid = validator.validate({ [column.id || 'field']: value })
      
      return {
        content: baseCell,
        isValid,
        errorMessage: isValid ? undefined : 'Invalid value'
      }
    }
  }
}
```

### 3. Event Enhancer

**File**: `packages/tanstack-adapter/src/columns/withEvents.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'
import type { EventEmitter } from '@gridkit/core'

export interface EventfulColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  onCellEdit?: (value: TValue, row: TData, rowIndex: number) => void
  onCellClick?: (value: TValue, row: TData, rowIndex: number) => void
  onCellFocus?: (value: TValue, row: TData, rowIndex: number) => void
  eventEmitter?: EventEmitter
}

export function withEvents<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  eventEmitter: EventEmitter,
  handlers?: {
    onEdit?: (value: TValue, row: TData, rowIndex: number) => void
    onClick?: (value: TValue, row: TData, rowIndex: number) => void
    onFocus?: (value: TValue, row: TData, rowIndex: number) => void
  }
): EventfulColumnDef<TData, TValue> {
  return {
    ...column,
    eventEmitter,
    onCellEdit: handlers?.onEdit,
    onCellClick: handlers?.onClick,
    onCellFocus: handlers?.onFocus,
    
    // Enhance cell to emit events
    cell: (info) => {
      const baseCell = typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()
      
      const value = info.getValue() as TValue
      const row = info.row.original
      const rowIndex = info.row.index
      
      // Emit cell:render event
      eventEmitter.emit({
        type: 'cell:render',
        payload: { 
          columnId: column.id,
          value, 
          row, 
          rowIndex 
        }
      })
      
      return baseCell
    }
  }
}
```

### 4. Format Enhancer

**File**: `packages/tanstack-adapter/src/columns/withFormat.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'

export interface FormattedColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  format: (value: TValue) => string
  parse?: (input: string) => TValue
}

export function withFormat<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  formatter: (value: TValue) => string,
  parser?: (input: string) => TValue
): FormattedColumnDef<TData, TValue> {
  return {
    ...column,
    format: formatter,
    parse: parser,
    
    cell: (info) => {
      const value = info.getValue() as TValue
      return formatter(value)
    }
  }
}

// Common formatters
export const formatters = {
  currency: (decimals = 2) => 
    (value: number) => `$${value.toFixed(decimals)}`,
  
  percentage: (decimals = 1) => 
    (value: number) => `${(value * 100).toFixed(decimals)}%`,
  
  date: (format = 'YYYY-MM-DD') => 
    (value: Date | string) => {
      const date = typeof value === 'string' ? new Date(value) : value
      // Simple formatting - use date-fns or dayjs in production
      return date.toISOString().split('T')[0]
    },
  
  truncate: (maxLength = 50) => 
    (value: string) => 
      value.length > maxLength 
        ? `${value.slice(0, maxLength)}...` 
        : value,
  
  uppercase: () => (value: string) => value.toUpperCase(),
  
  lowercase: () => (value: string) => value.toLowerCase()
}
```

### 5. Metadata Enhancer

**File**: `packages/tanstack-adapter/src/columns/withMetadata.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'

export interface ColumnMetadata {
  label?: string
  description?: string
  category?: string
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
  tooltip?: string
  icon?: string
  width?: number | string
  minWidth?: number
  maxWidth?: number
  [key: string]: any
}

export interface MetadataColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  meta: ColumnMetadata
}

export function withMetadata<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  metadata: ColumnMetadata
): MetadataColumnDef<TData, TValue> {
  return {
    ...column,
    meta: {
      ...column.meta,
      ...metadata
    }
  }
}
```

### 6. Performance Enhancer

**File**: `packages/tanstack-adapter/src/columns/withPerformance.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'

export interface PerformantColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  cacheable: boolean
  memoize: boolean
}

export function withPerformance<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  options?: {
    cacheable?: boolean
    memoize?: boolean
  }
): PerformantColumnDef<TData, TValue> {
  const cache = new Map<string, any>()
  
  return {
    ...column,
    cacheable: options?.cacheable ?? true,
    memoize: options?.memoize ?? true,
    
    cell: (info) => {
      if (options?.cacheable) {
        const cacheKey = `${info.row.id}-${column.id}`
        
        if (cache.has(cacheKey)) {
          return cache.get(cacheKey)
        }
        
        const result = typeof column.cell === 'function'
          ? column.cell(info)
          : info.getValue()
        
        cache.set(cacheKey, result)
        return result
      }
      
      return typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()
    }
  }
}
```

### 7. Column Composition Helper

**File**: `packages/tanstack-adapter/src/columns/composeEnhancers.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table'

type ColumnEnhancer<TData, TValue = unknown> = (
  column: ColumnDef<TData, TValue>
) => ColumnDef<TData, TValue>

export function composeEnhancers<TData, TValue = unknown>(
  ...enhancers: ColumnEnhancer<TData, TValue>[]
): ColumnEnhancer<TData, TValue> {
  return (column: ColumnDef<TData, TValue>) =>
    enhancers.reduce(
      (enhanced, enhancer) => enhancer(enhanced),
      column
    )
}

// Example usage:
// const enhance = composeEnhancers(
//   (col) => withValidation(col, schema),
//   (col) => withFormat(col, formatter),
//   (col) => withMetadata(col, meta)
// )
// const enhancedColumn = enhance(baseColumn)
```

---

## Implementation Plan

### Days 1-2: Core Enhancers
- [ ] Implement `enhanceColumn()`
- [ ] Implement `withValidation()`
- [ ] Implement `withFormat()` + common formatters
- [ ] Write unit tests

### Days 3-4: Advanced Enhancers
- [ ] Implement `withEvents()`
- [ ] Implement `withMetadata()`
- [ ] Implement `withPerformance()`
- [ ] Write unit tests

### Day 5: Composition & Integration
- [ ] Implement `composeEnhancers()`
- [ ] Integration tests
- [ ] Documentation
- [ ] Examples

---

## Usage Examples

### Basic Enhancement

```typescript
import { enhanceColumn } from '@gridkit/tanstack-adapter/columns'

const column = enhanceColumn(
  {
    accessorKey: 'price',
    header: 'Price'
  },
  {
    validation: {
      type: 'number',
      min: 0
    },
    format: (value) => `$${value.toFixed(2)}`,
    meta: {
      label: 'Product Price',
      editable: true
    }
  }
)
```

### Validation

```typescript
import { withValidation } from '@gridkit/tanstack-adapter/columns'

const validatedColumn = withValidation(
  { accessorKey: 'email', header: 'Email' },
  {
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true
  }
)
```

### Formatting

```typescript
import { withFormat, formatters } from '@gridkit/tanstack-adapter/columns'

const priceColumn = withFormat(
  { accessorKey: 'price', header: 'Price' },
  formatters.currency(2)
)

const percentColumn = withFormat(
  { accessorKey: 'completion', header: 'Progress' },
  formatters.percentage(1)
)
```

### Events

```typescript
import { withEvents } from '@gridkit/tanstack-adapter/columns'

const eventfulColumn = withEvents(
  { accessorKey: 'name', header: 'Name' },
  eventEmitter,
  {
    onClick: (value, row, index) => {
      console.log('Clicked:', value)
    },
    onEdit: (value, row, index) => {
      console.log('Edited:', value)
    }
  }
)
```

### Composition

```typescript
import { 
  composeEnhancers,
  withValidation,
  withFormat,
  withMetadata,
  formatters
} from '@gridkit/tanstack-adapter/columns'

const enhance = composeEnhancers(
  (col) => withValidation(col, {
    type: 'number',
    min: 0,
    max: 1000
  }),
  (col) => withFormat(col, formatters.currency(2)),
  (col) => withMetadata(col, {
    label: 'Product Price',
    description: 'Price in USD',
    editable: true,
    icon: 'dollar-sign'
  })
)

const enhancedColumn = enhance({
  accessorKey: 'price',
  header: 'Price'
})
```

### Complete Example

```typescript
import { 
  useGridEnhancedTable,
  composeEnhancers,
  withValidation,
  withFormat,
  withEvents,
  formatters
} from '@gridkit/tanstack-adapter'

function ProductTable() {
  const enhancePrice = composeEnhancers(
    (col) => withValidation(col, { type: 'number', min: 0 }),
    (col) => withFormat(col, formatters.currency(2))
  )
  
  const enhanceEmail = composeEnhancers(
    (col) => withValidation(col, { 
      type: 'string', 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    }),
    (col) => withEvents(col, eventEmitter, {
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

---

## Testing Strategy

```typescript
describe('enhanceColumn', () => {
  it('preserves base column definition', () => {
    const base = { accessorKey: 'name', header: 'Name' }
    const enhanced = enhanceColumn(base)
    
    expect(enhanced.accessorKey).toBe(base.accessorKey)
    expect(enhanced.header).toBe(base.header)
  })
  
  it('adds enhancements', () => {
    const enhanced = enhanceColumn(
      { accessorKey: 'price', header: 'Price' },
      {
        validation: { type: 'number', min: 0 },
        format: (v) => `$${v}`
      }
    )
    
    expect(enhanced.validation).toBeDefined()
    expect(enhanced.format).toBeDefined()
  })
})

describe('withValidation', () => {
  it('validates cell values', async () => {
    const column = withValidation(
      { accessorKey: 'age', header: 'Age' },
      { type: 'number', min: 0, max: 120 }
    )
    
    const result = await column.validateCell(25, {})
    expect(result.valid).toBe(true)
    
    const invalid = await column.validateCell(-5, {})
    expect(invalid.valid).toBe(false)
  })
})

describe('withFormat', () => {
  it('formats cell values', () => {
    const column = withFormat(
      { accessorKey: 'price', header: 'Price' },
      formatters.currency(2)
    )
    
    const formatted = column.format(99.99)
    expect(formatted).toBe('$99.99')
  })
})

describe('composeEnhancers', () => {
  it('applies enhancers in order', () => {
    const enhance = composeEnhancers(
      (col) => ({ ...col, prop1: 'a' }),
      (col) => ({ ...col, prop2: 'b' })
    )
    
    const result = enhance({ accessorKey: 'test' })
    
    expect(result.prop1).toBe('a')
    expect(result.prop2).toBe('b')
  })
})
```

---

## Success Criteria

- ✅ All TanStack column API preserved
- ✅ Enhancers composable
- ✅ TypeScript fully typed
- ✅ No breaking changes
- ✅ All tests passing (>95% coverage)
- ✅ Common formatters included
- ✅ Documentation with examples

---

## Files to Create

- `packages/tanstack-adapter/src/columns/enhanceColumn.ts`
- `packages/tanstack-adapter/src/columns/withValidation.ts`
- `packages/tanstack-adapter/src/columns/withFormat.ts`
- `packages/tanstack-adapter/src/columns/withEvents.ts`
- `packages/tanstack-adapter/src/columns/withMetadata.ts`
- `packages/tanstack-adapter/src/columns/withPerformance.ts`
- `packages/tanstack-adapter/src/columns/composeEnhancers.ts`
- `packages/tanstack-adapter/src/columns/index.ts`
- `packages/tanstack-adapter/src/__tests__/columns.test.ts`

---

## Pre-built Formatters

The package will include common formatters out of the box:

- `formatters.currency(decimals)` - Currency formatting
- `formatters.percentage(decimals)` - Percentage formatting
- `formatters.date(format)` - Date formatting
- `formatters.truncate(maxLength)` - Text truncation
- `formatters.uppercase()` - Uppercase conversion
- `formatters.lowercase()` - Lowercase conversion
- `formatters.number(decimals)` - Number formatting
- `formatters.fileSize()` - File size formatting (KB, MB, GB)
- `formatters.phoneNumber()` - Phone number formatting
- `formatters.boolean(trueText, falseText)` - Boolean formatting

---

**Author**: GridKit Team  
**Created**: 2026-02-23
