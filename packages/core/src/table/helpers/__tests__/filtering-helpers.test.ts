import { describe, it, expect } from 'vitest';
import {
  setColumnFilter,
  removeColumnFilter,
  getColumnFilter,
  getColumnFilterValue,
  getColumnFilterOperator,
  isColumnFiltered,
  clearAllFilters,
  getActiveFilterCount,
  updateColumnFilterOperator,
  getFilteredColumnIds,
} from '../filtering-helpers';
import type { FilteringState, FilterOperator } from '@/types/table';

describe('Filtering Helpers', () => {
  describe('setColumnFilter', () => {
    it('should add new filter with default operator', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'name', 'john');
      
      expect(result).toEqual([
        { id: 'name', value: 'john', operator: 'equals' }
      ]);
    });

    it('should add new filter with custom operator', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'name', 'john', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'john', operator: 'contains' }
      ]);
    });

    it('should replace existing filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = setColumnFilter(state, 'name', 'jane', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'jane', operator: 'contains' }
      ]);
    });

    it('should preserve other filters', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ];
      const result = setColumnFilter(state, 'name', 'jane', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'jane', operator: 'contains' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ]);
    });

    it('should support number values', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'age', 25, 'greaterThan');
      
      expect(result).toEqual([
        { id: 'age', value: 25, operator: 'greaterThan' }
      ]);
    });

    it('should support range values', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'age', { min: 18, max: 65 }, 'between');
      
      expect(result).toEqual([
        { id: 'age', value: { min: 18, max: 65 }, operator: 'between' }
      ]);
    });
  });

  describe('removeColumnFilter', () => {
    it('should remove filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = removeColumnFilter(state, 'name');
      
      expect(result).toEqual([]);
    });

    it('should preserve other filters', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ];
      const result = removeColumnFilter(state, 'name');
      
      expect(result).toEqual([
        { id: 'age', value: 25, operator: 'greaterThan' }
      ]);
    });

    it('should handle non-existent filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = removeColumnFilter(state, 'email');
      
      expect(result).toEqual(state);
    });
  });

  describe('getColumnFilter', () => {
    it('should return filter for existing column', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = getColumnFilter(state, 'name');
      
      expect(result).toEqual({ id: 'name', value: 'john', operator: 'equals' });
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState[] = [];
      const result = getColumnFilter(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('getColumnFilterValue', () => {
    it('should return filter value', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = getColumnFilterValue(state, 'name');
      
      expect(result).toBe('john');
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState[] = [];
      const result = getColumnFilterValue(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('getColumnFilterOperator', () => {
    it('should return filter operator', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'contains' }
      ];
      const result = getColumnFilterOperator(state, 'name');
      
      expect(result).toBe('contains');
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState[] = [];
      const result = getColumnFilterOperator(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('isColumnFiltered', () => {
    it('should return true for filtered column', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      expect(isColumnFiltered(state, 'name')).toBe(true);
    });

    it('should return false for non-filtered column', () => {
      const state: FilteringState[] = [];
      expect(isColumnFiltered(state, 'name')).toBe(false);
    });
  });

  describe('clearAllFilters', () => {
    it('should return empty array', () => {
      expect(clearAllFilters()).toEqual([]);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 for empty state', () => {
      expect(getActiveFilterCount([])).toBe(0);
    });

    it('should return correct count', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ];
      expect(getActiveFilterCount(state)).toBe(2);
    });
  });

  describe('updateColumnFilterOperator', () => {
    it('should update operator for existing filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = updateColumnFilterOperator(state, 'name', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'john', operator: 'contains' }
      ]);
    });

    it('should not change state if filter does not exist', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = updateColumnFilterOperator(state, 'email', 'contains');
      
      expect(result).toEqual(state);
      expect(result).not.toBe(state); // Should return new array
    });
  });

  describe('getFilteredColumnIds', () => {
    it('should return empty array for no filters', () => {
      const state: FilteringState[] = [];
      expect(getFilteredColumnIds(state)).toEqual([]);
    });

    it('should return all filtered column IDs', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
        { id: 'email', value: '@test', operator: 'contains' },
      ];
      expect(getFilteredColumnIds(state)).toEqual(['name', 'age', 'email']);
    });
  });

  describe('Immutability', () => {
    it('setColumnFilter should not mutate original state', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const original = [...state];
      
      setColumnFilter(state, 'age', 25);
      
      expect(state).toEqual(original);
    });

    it('removeColumnFilter should not mutate original state', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const original = [...state];
      
      removeColumnFilter(state, 'name');
      
      expect(state).toEqual(original);
    });

    it('updateColumnFilterOperator should not mutate original state', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const original = [...state];
      
      updateColumnFilterOperator(state, 'name', 'contains');
      
      expect(state).toEqual(original);
    });
  });
});
