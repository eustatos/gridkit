# Architecture Decision: TanStack Table Adapter

**Date**: 2026-02-23  
**Status**: ✅ Approved  
**Decision**: Create separate `@gridkit/tanstack-adapter` package

---

## Context

GridKit Enhanced позиционируется как **комплементарное решение** для TanStack Table, добавляющее enterprise-функции. Возникает вопрос архитектуры:

### Вариант 1: Монолитный подход
```
@gridkit/core - полная замена TanStack Table
```

### Вариант 2: Адаптер (✅ Выбран)
```
@gridkit/core - базовые enterprise-функции
@gridkit/tanstack-adapter - интеграция с TanStack Table
```

---

## Решение

Создаем **отдельный пакет-адаптер** `@gridkit/tanstack-adapter`.

---

## Преимущества

### 1. Четкое разделение ответственности

```
@gridkit/core
├─ Event system
├─ Performance monitoring
├─ Validation framework
├─ Plugin system
└─ Debug tools

@gridkit/tanstack-adapter
├─ TanStack Table integration
├─ Hook wrappers (useGridEnhancedTable)
├─ Column enhancement
└─ React-specific features
```

### 2. Гибкость интеграции

```typescript
// Опция 1: Полная интеграция
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

// Опция 2: Выборочная интеграция
import { useReactTable } from '@tanstack/react-table'
import { withPerformanceMonitoring } from '@gridkit/tanstack-adapter'

const table = withPerformanceMonitoring(
  useReactTable({ data, columns })
)

// Опция 3: Standalone GridKit (без TanStack)
import { createTable } from '@gridkit/core'

const table = createTable({ data, columns })
```

### 3. Меньше зависимостей

```json
// @gridkit/core - НИКАКИХ зависимостей от TanStack
{
  "dependencies": {}
}

// @gridkit/tanstack-adapter - только здесь
{
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0"
  },
  "dependencies": {
    "@gridkit/core": "workspace:*"
  }
}
```

### 4. Проще тестирование

```typescript
// Тесты @gridkit/core - без TanStack
describe('@gridkit/core', () => {
  it('works standalone', () => {
    const table = createTable({ data, columns })
    expect(table).toBeDefined()
  })
})

// Тесты адаптера - с TanStack
describe('@gridkit/tanstack-adapter', () => {
  it('enhances TanStack Table', () => {
    const table = useGridEnhancedTable({ data, columns })
    expect(table.metrics).toBeDefined() // GridKit feature
    expect(table.getRowModel).toBeDefined() // TanStack feature
  })
})
```

### 5. Будущее расширение

```
@gridkit/tanstack-adapter  (React + TanStack)
@gridkit/ag-grid-adapter   (AG Grid)
@gridkit/material-adapter  (Material Table)
@gridkit/vue-adapter       (Vue)
@gridkit/svelte-adapter    (Svelte)
```

---

## Архитектура

### Слои

```
┌─────────────────────────────────────┐
│   Application Layer                 │
│   (React components)                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   @gridkit/tanstack-adapter         │
│   - useGridEnhancedTable()          │
│   - Column enhancers                │
│   - React hooks                     │
└─────────────────────────────────────┘
              ↓
┌──────────────────┬──────────────────┐
│  @gridkit/core   │ @tanstack/table  │
│  - Events        │ - Row models     │
│  - Performance   │ - Sorting        │
│  - Validation    │ - Filtering      │
│  - Plugins       │ - Pagination     │
└──────────────────┴──────────────────┘
```

### Пакеты

```
packages/
├── core/                    # @gridkit/core
│   ├── src/
│   │   ├── events/         # Event system
│   │   ├── performance/    # Performance monitoring
│   │   ├── validation/     # Validation framework
│   │   ├── plugin/         # Plugin system
│   │   └── debug/          # Debug tools
│   └── package.json
│
├── tanstack-adapter/        # @gridkit/tanstack-adapter
│   ├── src/
│   │   ├── core/           # Core adapter logic
│   │   ├── react/          # React hooks
│   │   ├── enhancers/      # Table/Column enhancers
│   │   └── index.ts
│   └── package.json
│
└── plugins/                 # @gridkit/plugins (official)
    ├── src/
    │   ├── audit-log/
    │   ├── analytics/
    │   └── export/
    └── package.json
```

---

## Использование

### Базовый пример

```typescript
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter/react'
import { z } from 'zod'

const table = useGridEnhancedTable({
  // TanStack Table options
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  
  // GridKit Enhanced features
  features: {
    events: {
      enabled: true,
      middleware: [
        createLoggingMiddleware(),
        createDebounceMiddleware({ wait: 300 })
      ]
    },
    
    performance: {
      enabled: true,
      budgets: {
        rowModelBuild: 16,
        sorting: 50
      },
      alerts: {
        destinations: ['console', 'sentry']
      }
    },
    
    validation: {
      mode: 'strict',
      autoFix: true
    },
    
    plugins: [
      auditLogPlugin({ destination: 'api/logs' }),
      analyticsPlugin({ provider: 'mixpanel' })
    ]
  }
})

// Используем как обычный TanStack Table
const rows = table.getRowModel().rows

// + GridKit Enhanced features
table.on('row:select', handleSelect)
const metrics = table.metrics.getOperationStats('sorting')
```

### Column-level features

```typescript
const columns = [
  {
    accessorKey: 'email',
    header: 'Email',
    
    // TanStack features
    enableSorting: true,
    
    // GridKit validation
    meta: {
      validation: {
        schema: z.string().email(),
        async: true
      }
    }
  }
]
```

### Постепенная миграция

```typescript
// Шаг 1: Начните с TanStack Table
const table = useReactTable({ data, columns })

// Шаг 2: Добавьте performance monitoring
import { withPerformanceMonitoring } from '@gridkit/tanstack-adapter'
const table = withPerformanceMonitoring(
  useReactTable({ data, columns })
)

// Шаг 3: Добавьте события
import { withEvents } from '@gridkit/tanstack-adapter'
const table = withEvents(
  withPerformanceMonitoring(
    useReactTable({ data, columns })
  )
)

// Шаг 4: Полная интеграция
const table = useGridEnhancedTable({
  data,
  columns,
  features: { events: true, performance: true }
})
```

---

## Обновление задач

### Phase 1 изменения

#### ENT-EVT-001: Event System Enhancement
- ✅ Остается без изменений в `@gridkit/core`
- ➕ Добавить интеграцию в `@gridkit/tanstack-adapter`

#### ENT-PERF-001: Performance Monitoring
- ✅ Остается без изменений в `@gridkit/core`
- ➕ Добавить мониторинг TanStack операций

#### ENT-VAL-001: Validation Framework
- ✅ Остается без изменений в `@gridkit/core`
- ➕ Добавить column meta validation

#### ENT-PLUG-001: Plugin System Enhancement
- ✅ Остается без изменений в `@gridkit/core`
- ➕ Добавить TanStack-specific плагины

### Новые задачи

#### ADAPTER-001: Core Adapter Implementation
**Effort**: 2 weeks  
**Priority**: P0

Создать базовый адаптер:
- `createEnhancedTable()` - core функция
- `withEvents()` - HOC для событий
- `withPerformanceMonitoring()` - HOC для мониторинга
- `withValidation()` - HOC для валидации

#### ADAPTER-002: React Hooks
**Effort**: 1 week  
**Priority**: P0

React-специфичные хуки:
- `useGridEnhancedTable()` - главный хук
- `useTableEvents()` - события
- `useTableMetrics()` - метрики
- `useValidation()` - валидация

#### ADAPTER-003: Column Enhancers
**Effort**: 1 week  
**Priority**: P1

Расширение column definition:
- Validation schema в meta
- Performance tracking
- Custom event handlers

---

## Migration Guide

### Для существующих TanStack Table пользователей

```typescript
// До
import { useReactTable } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel()
})

// После (минимальные изменения)
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter/react'

const table = useGridEnhancedTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  
  // + опционально добавить features
  features: {
    performance: true  // just enable monitoring
  }
})

// Весь существующий код работает как раньше!
const rows = table.getRowModel().rows
```

---

## Timeline Update

### Phase 1: Core + Adapter Foundation (Months 1-3)

**Week 1-6: Core Features** (без изменений)
- ENT-EVT-001: Event System
- ENT-PERF-001: Performance Monitoring
- ENT-VAL-001: Validation

**Week 7-10: Adapter** (новое)
- ADAPTER-001: Core Adapter (2 weeks)
- ADAPTER-002: React Hooks (1 week)
- ADAPTER-003: Column Enhancers (1 week)

**Week 11-12: Integration & Testing**
- Integration tests
- Documentation
- Examples

---

## Success Criteria

- ✅ `@gridkit/core` работает standalone (без TanStack)
- ✅ `@gridkit/tanstack-adapter` добавляет features к TanStack Table
- ✅ Существующий TanStack код работает без изменений
- ✅ Постепенная миграция возможна (step-by-step)
- ✅ Zero breaking changes для TanStack API
- ✅ Документация для обоих use cases

---

## Risks & Mitigation

### Risk: API несовместимость
**Mitigation**: Тщательное тестирование с различными версиями TanStack Table

### Risk: Performance overhead
**Mitigation**: Benchmarks, opt-in features, lazy loading

### Risk: Сложность для пользователей
**Mitigation**: Простые defaults, хорошая документация, примеры

---

## Conclusion

Архитектура с отдельным адаптером дает:
- ✅ Чистое разделение кода
- ✅ Гибкость интеграции
- ✅ Возможность standalone использования
- ✅ Простоту тестирования
- ✅ Будущие возможности расширения

**Решение**: Создаем `@gridkit/tanstack-adapter` как отдельный пакет.

---

**Author**: GridKit Team  
**Approved**: 2026-02-23  
**Status**: Active
