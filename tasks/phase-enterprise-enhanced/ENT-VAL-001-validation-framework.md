# ENT-VAL-001: Enterprise Validation Framework

**Status**: 🟢 Ready  
**Priority**: P0 - Critical  
**Estimated Effort**: 3 weeks  
**Phase**: 1 - Core Enhancement  
**Dependencies**: ENT-EVT-001 (Event System)

---

## Objective

Implement enterprise-grade schema-based validation with support for Zod, Yup, Joi, async validation, auto-fix, caching, and compliance reporting.

---

## Current State (TanStack Table)

```typescript
// ❌ No built-in validation
const [errors, setErrors] = useState({})

const validateRow = (row) => {
  const newErrors = {}
  if (!row.firstName) newErrors.firstName = 'Required'
  if (row.age < 0) newErrors.age = 'Invalid'
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

---

## Target State (GridKit Enhanced)

```typescript
// ✅ Declarative schema-based validation
const table = useGridEnhancedTable({
  data,
  columns: [
    {
      accessorKey: 'email',
      meta: {
        validation: {
          schema: z.string().email(),
          async: true
        }
      }
    }
  ],
  features: {
    validation: {
      mode: 'strict',
      throwOnError: false,
      autoFix: true,
      cache: true
    }
  }
})

// Validate single row
const result = await table.validateRow(rowData, rowIndex)

// Mass validation
const report = table.validateAll()

// Real-time events
table.on('validation:error', (event) => {
  toast.error(`Error in row ${event.payload.rowIndex}`)
})
```

---

## Technical Requirements

### 1. Validation Schema Types

**File**: `packages/core/src/validation/types/schema.ts`

```typescript
import type { z } from 'zod'
import type { Schema as YupSchema } from 'yup'
import type { Schema as JoiSchema } from 'joi'

export type ValidationSchema = 
  | z.ZodSchema
  | YupSchema
  | JoiSchema
  | CustomValidationSchema

export interface CustomValidationSchema {
  validate(value: unknown): ValidationResult | Promise<ValidationResult>
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
  fixed?: boolean
  fixedValue?: unknown
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
  path?: string[]
  value?: unknown
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
  suggestion?: string
}
```

### 2. Column Validation Configuration

**File**: `packages/core/src/types/column/Validation.ts`

```typescript
export interface ColumnValidation<TValue = unknown> {
  // Schema validation
  schema?: ValidationSchema
  
  // Validation mode
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'manual'
  
  // Async validation
  async?: boolean
  asyncDebounce?: number
  
  // Auto-fix
  autoFix?: boolean
  fixFunction?: (value: TValue) => TValue
  
  // Custom validation
  validate?: (value: TValue, row: any) => ValidationResult | Promise<ValidationResult>
  
  // Caching
  cache?: boolean
  cacheTTL?: number
}

export interface ColumnMeta {
  validation?: ColumnValidation
  // ... other meta
}
```

### 3. Table Validation Configuration

**File**: `packages/core/src/types/table/Validation.ts`

```typescript
export interface TableValidationConfig {
  // Global validation mode
  mode?: 'strict' | 'normal' | 'minimal' | 'none'
  
  // Error handling
  throwOnError?: boolean
  stopOnFirstError?: boolean
  
  // Auto-fix
  autoFix?: boolean
  
  // Caching
  cache?: boolean
  cacheSize?: number
  
  // Compliance
  compliance?: {
    gdpr?: boolean
    hipaa?: boolean
    sox?: boolean
    pii?: {
      mask?: string[]
      encrypt?: string[]
    }
  }
  
  // Reporting
  reporting?: {
    enabled?: boolean
    format?: 'json' | 'csv' | 'pdf'
    destination?: string
  }
}
```

### 4. Validation Manager

**File**: `packages/core/src/validation/ValidationManager.ts`

```typescript
export class ValidationManager {
  private cache: ValidationCache
  private schemas: Map<string, ValidationSchema> = new Map()
  
  constructor(private config: TableValidationConfig) {
    this.cache = new ValidationCache(config.cacheSize)
  }
  
  // Validation
  async validateValue<T>(
    value: T,
    schema: ValidationSchema,
    options?: ValidateOptions
  ): Promise<ValidationResult>
  
  async validateRow(
    row: any,
    columns: Column[],
    rowIndex: number
  ): Promise<RowValidationResult>
  
  async validateAll(
    data: any[],
    columns: Column[]
  ): Promise<ValidationReport>
  
  // Schema management
  registerSchema(columnId: string, schema: ValidationSchema): void
  getSchema(columnId: string): ValidationSchema | undefined
  
  // Auto-fix
  autoFixValue<T>(value: T, schema: ValidationSchema): T | undefined
  autoFixRow(row: any, columns: Column[]): any
  
  // Reporting
  generateReport(results: RowValidationResult[]): ValidationReport
  exportReport(report: ValidationReport, format: 'json' | 'csv' | 'pdf'): string
  
  // Compliance
  maskPII(row: any, fields: string[]): any
  encryptPII(row: any, fields: string[]): any
  generateComplianceReport(options: ComplianceOptions): ComplianceReport
}
```

### 5. Validation Cache

**File**: `packages/core/src/validation/ValidationCache.ts`

```typescript
export class ValidationCache {
  private cache: LRUCache<string, ValidationResult>
  
  constructor(maxSize: number = 1000) {
    this.cache = new LRUCache({ max: maxSize })
  }
  
  get(key: string): ValidationResult | undefined
  set(key: string, result: ValidationResult, ttl?: number): void
  clear(): void
  
  private generateKey(value: unknown, schema: ValidationSchema): string
}
```

### 6. Schema Adapters

**File**: `packages/core/src/validation/adapters/index.ts`

```typescript
export interface SchemaAdapter<T = unknown> {
  validate(value: unknown, schema: T): Promise<ValidationResult>
  supports(schema: unknown): boolean
}

export class ZodAdapter implements SchemaAdapter<z.ZodSchema> {
  async validate(value: unknown, schema: z.ZodSchema): Promise<ValidationResult> {
    const result = await schema.safeParseAsync(value)
    
    if (result.success) {
      return { valid: true, errors: [] }
    }
    
    return {
      valid: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        severity: 'error'
      }))
    }
  }
  
  supports(schema: unknown): boolean {
    return schema instanceof z.ZodSchema
  }
}

export class YupAdapter implements SchemaAdapter<YupSchema>
export class JoiAdapter implements SchemaAdapter<JoiSchema>
```

### 7. Validation Events

**File**: `packages/core/src/events/types/validation.ts`

```typescript
export interface ValidationStartEvent extends BaseEvent {
  type: 'validation:start'
  payload: {
    rowIndex?: number
    columnId?: string
    mode: 'row' | 'cell' | 'all'
  }
}

export interface ValidationCompleteEvent extends BaseEvent {
  type: 'validation:complete'
  payload: {
    result: ValidationResult | ValidationReport
    duration: number
    cached: boolean
  }
}

export interface ValidationErrorEvent extends BaseEvent {
  type: 'validation:error'
  payload: {
    rowIndex: number
    columnId: string
    error: ValidationError
  }
}

export interface ValidationFixedEvent extends BaseEvent {
  type: 'validation:fixed'
  payload: {
    rowIndex: number
    columnId: string
    oldValue: unknown
    newValue: unknown
  }
}
```

---

## Implementation Plan

### Step 1: Core Types & Interfaces
- [ ] Define validation schema types
- [ ] Define validation result types
- [ ] Define column validation config
- [ ] Define table validation config
- [ ] Write type tests

### Step 2: Schema Adapters
- [ ] Create adapter interface
- [ ] Implement Zod adapter
- [ ] Implement Yup adapter
- [ ] Implement Joi adapter
- [ ] Add custom schema support
- [ ] Write tests

### Step 3: Validation Cache
- [ ] Implement LRU cache
- [ ] Add cache key generation
- [ ] Add TTL support
- [ ] Add cache statistics
- [ ] Write tests

### Step 4: Validation Manager
- [ ] Implement value validation
- [ ] Implement row validation
- [ ] Implement mass validation
- [ ] Add auto-fix logic
- [ ] Add async validation
- [ ] Write tests

### Step 5: Compliance Features
- [ ] Implement PII masking
- [ ] Implement PII encryption
- [ ] Add compliance reporting
- [ ] Add GDPR support
- [ ] Add HIPAA support
- [ ] Write tests

### Step 6: Event Integration
- [ ] Define validation events
- [ ] Emit events from manager
- [ ] Add event handlers in table
- [ ] Write integration tests

### Step 7: Table Integration
- [ ] Add validation config to table options
- [ ] Integrate manager with table instance
- [ ] Add validation methods to table API
- [ ] Add column-level validation
- [ ] Write integration tests

### Step 8: Documentation
- [ ] API documentation
- [ ] Schema examples (Zod, Yup, Joi)
- [ ] Compliance guide
- [ ] Best practices
- [ ] Migration guide

---

## Testing Strategy

### Unit Tests

```typescript
describe('ValidationManager', () => {
  it('should validate with Zod schema', async () => {
    const manager = new ValidationManager({ mode: 'strict' })
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(0).max(150)
    })
    
    const result = await manager.validateValue(
      { email: 'invalid', age: -5 },
      schema
    )
    
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })
  
  it('should use cache for repeated validations', async () => {
    const manager = new ValidationManager({ cache: true })
    const schema = z.string().email()
    
    const result1 = await manager.validateValue('test@example.com', schema)
    const result2 = await manager.validateValue('test@example.com', schema)
    
    expect(result2).toBe(result1) // Same object from cache
  })
  
  it('should auto-fix values', async () => {
    const manager = new ValidationManager({ autoFix: true })
    const schema = z.string().trim().toLowerCase()
    
    const fixed = manager.autoFixValue('  TEST@EXAMPLE.COM  ', schema)
    
    expect(fixed).toBe('test@example.com')
  })
})
```

### Integration Tests

```typescript
describe('Table Validation Integration', () => {
  it('should validate rows automatically', async () => {
    const table = createTable({
      data: [
        { email: 'valid@test.com', age: 25 },
        { email: 'invalid', age: -5 }
      ],
      columns: [
        {
          accessorKey: 'email',
          meta: {
            validation: {
              schema: z.string().email()
            }
          }
        },
        {
          accessorKey: 'age',
          meta: {
            validation: {
              schema: z.number().min(0).max(150)
            }
          }
        }
      ],
      features: {
        validation: {
          mode: 'strict'
        }
      }
    })
    
    const report = await table.validateAll()
    
    expect(report.summary.invalid).toBe(1)
    expect(report.errors).toHaveLength(2)
  })
  
  it('should emit validation events', async () => {
    const table = createTable({
      data,
      columns,
      features: {
        validation: { mode: 'strict' }
      }
    })
    
    const errors: ValidationError[] = []
    table.on('validation:error', (event) => {
      errors.push(event.payload.error)
    })
    
    await table.validateRow({ email: 'invalid' }, 0)
    
    expect(errors).toHaveLength(1)
  })
})
```

---

## Performance Requirements

- **Sync validation**: < 1ms per value
- **Async validation**: < 100ms per value
- **Cache hit**: < 0.1ms
- **Mass validation (1000 rows)**: < 500ms
- **Report generation**: < 100ms
- **Memory overhead**: < 1MB per 1000 cached results

---

## Success Criteria

- ✅ Support for Zod, Yup, Joi schemas
- ✅ Async validation working
- ✅ Auto-fix functional
- ✅ Caching operational
- ✅ Compliance features (PII masking/encryption)
- ✅ All events emitted correctly
- ✅ Table integration seamless
- ✅ All tests passing (>95% coverage)
- ✅ Documentation complete

---

## Usage Examples

### Basic Validation
```typescript
const table = createTable({
  data,
  columns: [
    {
      accessorKey: 'email',
      meta: {
        validation: {
          schema: z.string().email()
        }
      }
    }
  ],
  features: {
    validation: { mode: 'strict' }
  }
})
```

### Async Validation
```typescript
{
  accessorKey: 'username',
  meta: {
    validation: {
      async: true,
      asyncDebounce: 300,
      validate: async (value) => {
        const exists = await api.checkUsername(value)
        return {
          valid: !exists,
          errors: exists ? [{
            field: 'username',
            message: 'Username already taken',
            code: 'unique_violation',
            severity: 'error'
          }] : []
        }
      }
    }
  }
}
```

### Compliance
```typescript
const table = createTable({
  data,
  columns,
  features: {
    validation: {
      mode: 'strict',
      compliance: {
        gdpr: true,
        pii: {
          mask: ['email', 'phone'],
          encrypt: ['ssn', 'salary']
        }
      }
    }
  }
})
```

---

## Files to Create/Modify

### New Files
- `packages/core/src/validation/types/schema.ts`
- `packages/core/src/validation/ValidationManager.ts`
- `packages/core/src/validation/ValidationCache.ts`
- `packages/core/src/validation/adapters/index.ts`
- `packages/core/src/validation/adapters/zod.ts`
- `packages/core/src/validation/adapters/yup.ts`
- `packages/core/src/validation/adapters/joi.ts`
- `packages/core/src/validation/compliance/pii.ts`
- `packages/core/src/validation/compliance/reporting.ts`
- `packages/core/src/events/types/validation.ts`
- `packages/core/src/validation/__tests__/manager.test.ts`

### Modified Files
- `packages/core/src/types/column/ColumnDef.ts` (meta.validation)
- `packages/core/src/types/table/TableOptions.ts` (features.validation)
- `packages/core/src/table/instance/TableInstance.ts` (validation methods)
- `packages/core/src/validation/index.ts` (exports)

---

## References

- [Validation System](../../packages/core/src/validation/README.md)
- [Zod Documentation](https://zod.dev)
- [Yup Documentation](https://github.com/jquense/yup)
- [Joi Documentation](https://joi.dev)
- [Complementary Benefits](../../docs/COMPLEMENTARY_SOLUTION_BENEFITS.md)

---

**Author**: GridKit Team  
**Created**: 2026-02-23  
**Last Updated**: 2026-02-23
