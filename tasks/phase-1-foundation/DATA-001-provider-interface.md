---
task_id: DATA-001
epic_id: EPIC-001
module: @gridkit/data
file: src/data/types/provider.ts
priority: P0
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies:
  - CORE-001
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Define Data Provider Interface

## Context

Define the abstraction for data providers - the Strategy pattern for data sources.
Providers abstract away where data comes from (static, REST, GraphQL, WebSocket, etc.).

## Objectives

- [ ] Define `DataProvider<TData>` interface
- [ ] Define `LoadParams` type (pagination, sorting, filtering)
- [ ] Define `DataResult<TData>` type
- [ ] Define `DataListener<TData>` type (for real-time updates)
- [ ] Add comprehensive JSDoc

## Implementation

**File: `src/data/types/provider.ts`**

```typescript
import type { RowData, Unsubscribe } from '@gridkit/core/types';

/**
 * Parameters for loading data.
 * Used by data providers to fetch/filter data.
 */
export interface LoadParams {
  /**
   * Pagination parameters
   */
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  
  /**
   * Sorting parameters
   */
  sorting?: Array<{
    id: string;
    desc: boolean;
  }>;
  
  /**
   * Filtering parameters
   */
  filtering?: Array<{
    id: string;
    value: unknown;
  }>;
}

/**
 * Result from data provider.
 */
export interface DataResult<TData extends RowData> {
  /**
   * Data rows
   */
  data: TData[];
  
  /**
   * Total row count (for pagination)
   */
  totalCount?: number;
  
  /**
   * Additional metadata
   */
  meta?: Record<string, unknown>;
}

/**
 * Listener for real-time data updates.
 */
export type DataListener<TData extends RowData> = (
  result: DataResult<TData>
) => void;

/**
 * Data provider interface.
 * Abstracts data source (static, REST, GraphQL, etc.).
 * 
 * @template TData - Row data type
 */
export interface DataProvider<TData extends RowData> {
  /**
   * Load data based on parameters.
   * 
   * @param params - Load parameters (pagination, sorting, filtering)
   * @returns Data result or promise
   */
  load(params: LoadParams): DataResult<TData> | Promise<DataResult<TData>>;
  
  /**
   * Save data (optional - not all providers support mutations).
   */
  save?(data: TData[]): void | Promise<void>;
  
  /**
   * Subscribe to real-time updates (optional).
   * 
   * @param listener - Callback for data updates
   * @returns Unsubscribe function
   */
  subscribe?(listener: DataListener<TData>): Unsubscribe;
}
```

## Tests

Type tests to ensure interface compatibility.

## Success Criteria

- [ ] Interface is flexible for all provider types
- [ ] JSDoc complete
- [ ] Type tests pass

## Related Tasks

- **Depends on:** CORE-001
- **Blocks:** DATA-002 (static provider implementation)