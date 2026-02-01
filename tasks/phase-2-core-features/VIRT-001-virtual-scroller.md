---
task_id: VIRT-001
epic_id: EPIC-002
module: @gridkit/features
file: src/features/virtualization/virtual-scroller.ts
priority: P1
complexity: high
estimated_tokens: ~20,000
assignable_to_ai: with-review
dependencies:
  - CORE-001
  - CORE-004
  - ROW-001
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
  - docs/patterns/performance-optimization.md
---

# Task: Virtual Scroller Core Algorithm

## Context

Implement the core virtual scrolling algorithm that calculates which rows should be rendered based on scroll position. This is **critical for performance** - must handle 100k+ rows efficiently.

⚠️ **This task requires careful review** - virtualization is complex!

## Guidelines Reference

- `.github/AI_GUIDELINES.md` - Performance requirements
- `CONTRIBUTING.md` - Code organization
- Reference: [TanStack Virtual](https://github.com/TanStack/virtual) for inspiration

## Objectives

- [ ] Calculate visible row range from scroll position
- [ ] Implement overscan for smooth scrolling
- [ ] Handle fixed row heights
- [ ] Calculate total scrollable height
- [ ] Optimize for 60fps scrolling

---

## Implementation Requirements

### 1. Types

**File: `src/features/virtualization/types.ts`**

```typescript
/**
 * Virtual scroller options.
 * 
 * @public
 */
export interface VirtualScrollerOptions {
  /**
   * Total number of items
   */
  count: number;
  
  /**
   * Height of each item in pixels
   * @default 40
   */
  itemHeight: number;
  
  /**
   * Height of viewport/container in pixels
   */
  viewportHeight: number;
  
  /**
   * Number of items to render above/below viewport
   * Improves scrolling smoothness
   * @default 5
   */
  overscan?: number;
  
  /**
   * Current scroll offset in pixels
   */
  scrollOffset: number;
}

/**
 * Virtual scroller result.
 * Describes which items should be rendered.
 * 
 * @public
 */
export interface VirtualScrollerResult {
  /**
   * Index of first visible item
   */
  startIndex: number;
  
  /**
   * Index of last visible item (exclusive)
   */
  endIndex: number;
  
  /**
   * Total height of all items
   */
  totalHeight: number;
  
  /**
   * Offset from top for positioning visible items
   */
  offsetTop: number;
  
  /**
   * Items to actually render (including overscan)
   */
  virtualItems: VirtualItem[];
}

/**
 * Virtual item metadata.
 * 
 * @public
 */
export interface VirtualItem {
  /**
   * Item index in full list
   */
  index: number;
  
  /**
   * Distance from top of scroll container
   */
  offsetTop: number;
  
  /**
   * Item height
   */
  height: number;
}
```

### 2. Core Algorithm

**File: `src/features/virtualization/virtual-scroller.ts`**

```typescript
import type {
  VirtualScrollerOptions,
  VirtualScrollerResult,
  VirtualItem,
} from './types';

/**
 * Calculate virtual scroll parameters.
 * Determines which items should be rendered based on scroll position.
 * 
 * @param options - Scroller configuration
 * @returns Virtual scroll result
 * 
 * @example
 * ```typescript
 * const result = calculateVirtualScroll({
 *   count: 10000,
 *   itemHeight: 40,
 *   viewportHeight: 600,
 *   scrollOffset: 4000,
 *   overscan: 5,
 * });
 * 
 * console.log(result.startIndex); // ~100
 * console.log(result.endIndex);   // ~115
 * console.log(result.totalHeight); // 400000
 * ```
 * 
 * @public
 */
export function calculateVirtualScroll(
  options: VirtualScrollerOptions
): VirtualScrollerResult {
  const {
    count,
    itemHeight,
    viewportHeight,
    scrollOffset,
    overscan = 5,
  } = options;
  
  // Calculate total height of all items
  const totalHeight = count * itemHeight;
  
  // Calculate first visible item index
  const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
  
  // Calculate last visible item index
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const endIndex = Math.min(
    count,
    startIndex + visibleCount + overscan * 2
  );
  
  // Calculate offset for positioning
  const offsetTop = startIndex * itemHeight;
  
  // Generate virtual items
  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    virtualItems.push({
      index: i,
      offsetTop: i * itemHeight,
      height: itemHeight,
    });
  }
  
  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetTop,
    virtualItems,
  };
}

/**
 * Calculate scroll offset to bring an item into view.
 * 
 * @param index - Item index to scroll to
 * @param itemHeight - Height of each item
 * @param viewportHeight - Viewport height
 * @param align - Alignment ('start' | 'center' | 'end')
 * @returns Required scroll offset
 * 
 * @public
 */
export function scrollToIndex(
  index: number,
  itemHeight: number,
  viewportHeight: number,
  align: 'start' | 'center' | 'end' = 'start'
): number {
  const itemOffset = index * itemHeight;
  
  switch (align) {
    case 'start':
      return itemOffset;
    case 'center':
      return itemOffset - viewportHeight / 2 + itemHeight / 2;
    case 'end':
      return itemOffset - viewportHeight + itemHeight;
    default:
      return itemOffset;
  }
}
```

---

## Test Requirements

```typescript
import { describe, it, expect } from 'vitest';
import { calculateVirtualScroll, scrollToIndex } from '../virtual-scroller';

describe('Virtual Scroller', () => {
  describe('calculateVirtualScroll', () => {
    it('should calculate visible range at top', () => {
      const result = calculateVirtualScroll({
        count: 1000,
        itemHeight: 40,
        viewportHeight: 600,
        scrollOffset: 0,
        overscan: 5,
      });
      
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBeLessThanOrEqual(25); // ~15 visible + 10 overscan
      expect(result.totalHeight).toBe(40000);
      expect(result.offsetTop).toBe(0);
    });

    it('should calculate visible range in middle', () => {
      const result = calculateVirtualScroll({
        count: 1000,
        itemHeight: 40,
        viewportHeight: 600,
        scrollOffset: 4000,
        overscan: 5,
      });
      
      // At offset 4000, first visible item is ~100
      expect(result.startIndex).toBeGreaterThanOrEqual(95);
      expect(result.startIndex).toBeLessThanOrEqual(100);
      expect(result.virtualItems.length).toBeGreaterThan(0);
    });

    it('should handle overscan correctly', () => {
      const withOverscan = calculateVirtualScroll({
        count: 1000,
        itemHeight: 40,
        viewportHeight: 600,
        scrollOffset: 0,
        overscan: 10,
      });
      
      const withoutOverscan = calculateVirtualScroll({
        count: 1000,
        itemHeight: 40,
        viewportHeight: 600,
        scrollOffset: 0,
        overscan: 0,
      });
      
      expect(withOverscan.virtualItems.length).toBeGreaterThan(
        withoutOverscan.virtualItems.length
      );
    });

    it('should not exceed total count', () => {
      const result = calculateVirtualScroll({
        count: 10,
        itemHeight: 40,
        viewportHeight: 600,
        scrollOffset: 0,
        overscan: 5,
      });
      
      expect(result.endIndex).toBe(10);
      expect(result.virtualItems.length).toBe(10);
    });

    it('should generate correct virtual items', () => {
      const result = calculateVirtualScroll({
        count: 100,
        itemHeight: 50,
        viewportHeight: 300,
        scrollOffset: 100,
        overscan: 0,
      });
      
      result.virtualItems.forEach((item, i) => {
        expect(item.index).toBe(result.startIndex + i);
        expect(item.height).toBe(50);
        expect(item.offsetTop).toBe(item.index * 50);
      });
    });
  });

  describe('scrollToIndex', () => {
    it('should calculate offset for start alignment', () => {
      const offset = scrollToIndex(10, 40, 600, 'start');
      expect(offset).toBe(400); // 10 * 40
    });

    it('should calculate offset for center alignment', () => {
      const offset = scrollToIndex(10, 40, 600, 'center');
      expect(offset).toBe(120); // 400 - 300 + 20
    });

    it('should calculate offset for end alignment', () => {
      const offset = scrollToIndex(10, 40, 600, 'end');
      expect(offset).toBe(-160); // 400 - 600 + 40
    });
  });

  describe('performance', () => {
    it('should handle 100k items efficiently', () => {
      const start = performance.now();
      
      const result = calculateVirtualScroll({
        count: 100000,
        itemHeight: 40,
        viewportHeight: 600,
        scrollOffset: 50000,
        overscan: 5,
      });
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // < 10ms
      expect(result.virtualItems.length).toBeLessThan(50); // Only visible items
    });
  });
});
```

---

## Performance Requirements

- Calculation time: **< 5ms** (needs to run on scroll)
- Memory: Only allocate array for visible items
- **60fps target:** Must complete in < 16ms per frame

---

## Edge Cases

- [ ] Empty list (count = 0)
- [ ] Very large counts (1M+ items)
- [ ] Scroll at bottom
- [ ] Viewport larger than total height
- [ ] Overscan larger than viewport

---

## Files to Create

- [ ] `src/features/virtualization/types.ts`
- [ ] `src/features/virtualization/virtual-scroller.ts`
- [ ] `src/features/virtualization/__tests__/virtual-scroller.test.ts`
- [ ] `src/features/virtualization/index.ts`

---

## Success Criteria

- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Handles 100k items < 10ms
- [ ] No memory leaks
- [ ] JSDoc complete

---

## Related Tasks

- **Depends on:** CORE-001, CORE-004, ROW-001
- **Blocks:** VIRT-002 (row recycling)

---

## Notes for AI

- This is performance-critical code
- Avoid allocations in calculation loop
- Keep algorithm simple and predictable
- Test with large datasets (100k+)
- Consider edge cases carefully