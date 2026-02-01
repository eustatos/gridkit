---
task_id: DATA-002
epic_id: EPIC-001
module: @gridkit/data
file: src/data/providers/static-provider.ts
priority: P0
complexity: low
estimated_tokens: ~10,000
assignable_to_ai: yes
dependencies:
  - DATA-001
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Implement Static Data Provider

## Context

Implement the simplest data provider - one that works with static arrays/JSON data.
This is the default provider used when you pass `data` array to table options.

## Objectives

- [ ] Implement `StaticDataProvider<TData>` class
- [ ] Implement `load()` method (returns data as-is)
- [ ] Optionally implement `save()` for in-memory updates
- [ ] Add tests with various data shapes
- [ ] Document usage patterns

## Implementation

**File: `src/data/providers/static-provider.ts`**

```typescript
import type { RowData } from '@gridkit/core/types';
import type {
  DataProvider,
  LoadParams,
  DataResult,
} from '../types/provider';

/**
 * Static data provider.
 * Works with in-memory data arrays.
 * 
 * @template TData - Row data type
 * 
 * @example
 * ```typescript
 * const provider = new StaticDataProvider([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 * ]);
 * 
 * const result = provider.load({});
 * console.log(result.data); // All data
 * ```
 * 
 * @public
 */
export class StaticDataProvider<TData extends RowData>
  implements DataProvider<TData>
{
  private data: TData[];
  
  /**
   * Creates a new static provider.
   * 
   * @param initialData - Initial data array
   */
  constructor(initialData: TData[] = []) {
    this.data = initialData;
  }
  
  /**
   * Load data.
   * For static provider, always returns all data.
   * Filtering/sorting/pagination handled by table.
   * 
   * @param params - Load parameters (ignored for static provider)
   * @returns All data
   */
  load(params: LoadParams): DataResult<TData> {
    return {
      data: this.data,
      totalCount: this.data.length,
    };
  }
  
  /**
   * Update data in-memory.
   * 
   * @param newData - New data array
   */
  save(newData: TData[]): void {
    this.data = newData;
  }
  
  /**
   * Get current data.
   * 
   * @returns Current data array
   */
  getData(): TData[] {
    return this.data;
  }
  
  /**
   * Set new data.
   * 
   * @param newData - New data array
   */
  setData(newData: TData[]): void {
    this.data = newData;
  }
}

/**
 * Factory function for creating static provider.
 * 
 * @param data - Initial data
 * @returns Static provider instance
 */
export function createStaticProvider<TData extends RowData>(
  data: TData[] = []
): StaticDataProvider<TData> {
  return new StaticDataProvider(data);
}
```

## Tests

**File: `src/data/providers/__tests__/static-provider.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { StaticDataProvider, createStaticProvider } from '../static-provider';

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

describe('StaticDataProvider', () => {
  describe('initialization', () => {
    it('should create with initial data', () => {
      const provider = new StaticDataProvider(users);
      expect(provider.getData()).toEqual(users);
    });

    it('should create with empty data by default', () => {
      const provider = new StaticDataProvider<User>();
      expect(provider.getData()).toEqual([]);
    });
  });

  describe('load', () => {
    it('should return all data', () => {
      const provider = new StaticDataProvider(users);
      const result = provider.load({});
      
      expect(result.data).toEqual(users);
      expect(result.totalCount).toBe(3);
    });

    it('should ignore load params (handled by table)', () => {
      const provider = new StaticDataProvider(users);
      const result = provider.load({
        pagination: { pageIndex: 0, pageSize: 1 },
      });
      
      // Returns all data - pagination is table's responsibility
      expect(result.data).toEqual(users);
    });
  });

  describe('save', () => {
    it('should update data', () => {
      const provider = new StaticDataProvider(users);
      const newUsers = [{ id: 4, name: 'David' }];
      
      provider.save(newUsers);
      
      expect(provider.getData()).toEqual(newUsers);
    });
  });

  describe('setData', () => {
    it('should replace data', () => {
      const provider = new StaticDataProvider(users);
      const newUsers = [{ id: 5, name: 'Eve' }];
      
      provider.setData(newUsers);
      
      expect(provider.getData()).toEqual(newUsers);
    });
  });
});

describe('createStaticProvider', () => {
  it('should create provider instance', () => {
    const provider = createStaticProvider(users);
    
    expect(provider).toBeInstanceOf(StaticDataProvider);
    expect(provider.getData()).toEqual(users);
  });

  it('should create with empty data by default', () => {
    const provider = createStaticProvider<User>();
    
    expect(provider.getData()).toEqual([]);
  });
});
```

## Edge Cases

- [ ] Empty data array
- [ ] Large datasets (10k+ rows)
- [ ] Null/undefined data
- [ ] Data mutation after creation

## Performance Requirements

- Load operation: **< 1ms** (just returns reference)
- No data copying (return reference)

## Files to Create/Modify

- [ ] `src/data/providers/static-provider.ts` - Implementation
- [ ] `src/data/providers/__tests__/static-provider.test.ts` - Tests
- [ ] `src/data/providers/index.ts` - Exports
- [ ] `src/data/index.ts` - Re-export

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compiles without errors
- [ ] Performance benchmarks met
- [ ] Follows DataProvider interface
- [ ] JSDoc complete

## Related Tasks

- **Depends on:** DATA-001
- **Blocks:** CORE-010 (table factory uses this)

## Notes for AI

- Keep it simple - this is the baseline provider
- No async operations needed (it's all in-memory)
- Don't handle filtering/sorting here - that's table's job
- Return reference to data, not a copy (performance)