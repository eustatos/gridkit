/**
 * Tests for StaticDataProvider.
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { StaticDataProvider, type StaticProviderOptions } from '../static';

// === Test Interfaces ===

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  profile?: {
    bio: string;
    avatar: string;
  };
}

interface Product {
  sku: string;
  title: string;
  price: number;
  inStock: boolean;
}

// === Constants ===

const users: User[] = [
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
];

const products: Product[] = [
  { sku: 'P001', title: 'Widget', price: 29.99, inStock: true },
  { sku: 'P002', title: 'Gadget', price: 49.99, inStock: false },
  { sku: 'P003', title: 'Gizmo', price: 19.99, inStock: true },
];

// === Tests ===

describe('StaticDataProvider', () => {
  describe('Initialization', () => {
    it('creates provider with empty data by default', () => {
      const provider = new StaticDataProvider<User>();
      expect(provider.getData()).toEqual([]);
    });

    it('creates provider with initial data', () => {
      const provider = new StaticDataProvider(users);
      expect(provider.getData()).toEqual(users);
    });

    it('deep clones initial data to prevent mutations', () => {
      const initialData: User[] = [{ id: 1, name: 'Alice', email: 'alice@example.com', age: 30 }];
      const provider = new StaticDataProvider(initialData);
      
      const getData = provider.getData();
      getData[0].name = 'Bob';
      
      expect(initialData[0].name).toBe('Alice');
      expect(provider.getData()[0].name).toBe('Alice');
    });

    it('accepts options during initialization', () => {
      const options: StaticProviderOptions = {
        applySorting: true,
        applyFiltering: true,
        applySearch: true,
        applyPagination: true,
        validateData: true,
      };

      const provider = new StaticDataProvider(users, options);
      
      expect(provider.meta.capabilities.supportsSorting).toBe(true);
      expect(provider.meta.capabilities.supportsFiltering).toBe(true);
      expect(provider.meta.capabilities.supportsSearch).toBe(true);
      expect(provider.meta.capabilities.supportsPagination).toBe(true);
    });
  });

  describe('Load Operation', () => {
    it('returns all data by default', async () => {
      const provider = new StaticDataProvider(users);
      const result = await provider.load({});

      expect(result.data).toEqual(users);
      expect(result.totalCount).toBe(3);
      expect(result.pageInfo).toBeUndefined();
      expect(result.meta?.source).toBe('static');
    });

    it('applies client-side sorting when enabled', async () => {
      const provider = new StaticDataProvider(users, { applySorting: true });

      const result = await provider.load({
        sorting: [{ id: 'name', desc: false }],
      });

      expect(result.data[0].name).toBe('Alice');
      expect(result.data[1].name).toBe('Bob');
      expect(result.data[2].name).toBe('Charlie');
    });

    it('applies descending client-side sorting', async () => {
      const provider = new StaticDataProvider(users, { applySorting: true });

      const result = await provider.load({
        sorting: [{ id: 'name', desc: true }],
      });

      expect(result.data[0].name).toBe('Charlie');
      expect(result.data[1].name).toBe('Bob');
      expect(result.data[2].name).toBe('Alice');
    });

    it('sorts by numeric field', async () => {
      const provider = new StaticDataProvider(users, { applySorting: true });

      const result = await provider.load({
        sorting: [{ id: 'age', desc: false }],
      });

      expect(result.data[0].age).toBe(25);
      expect(result.data[1].age).toBe(30);
      expect(result.data[2].age).toBe(35);
    });

    it('applies client-side filtering when enabled', async () => {
      const provider = new StaticDataProvider(users, { applyFiltering: true });

      const result = await provider.load({
        filtering: [{ id: 'name', value: 'Alice' }],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alice');
    });

    it('applies filter with operator', async () => {
      const provider = new StaticDataProvider(users, { applyFiltering: true });

      const result = await provider.load({
        filtering: [{ id: 'name', value: 'A', operator: 'startsWith' }],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alice');
    });

    it('applies multiple filters', async () => {
      const provider = new StaticDataProvider(users, { applyFiltering: true });

      const result = await provider.load({
        filtering: [
          { id: 'age', value: 30, operator: 'equals' },
          { id: 'name', value: 'Alice', operator: 'contains' },
        ],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alice');
    });

    it('applies client-side search when enabled', async () => {
      const provider = new StaticDataProvider(users, { applySearch: true });

      const result = await provider.load({
        search: 'alice',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alice');
    });

    it('searches across all string fields', async () => {
      const provider = new StaticDataProvider(users, { applySearch: true });

      const result = await provider.load({
        search: 'example.com',
      });

      expect(result.data).toHaveLength(3);
    });

    it('applies client-side pagination when enabled', async () => {
      const provider = new StaticDataProvider(users, { applyPagination: true });

      const result = await provider.load({
        pagination: { pageIndex: 1, pageSize: 2 },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Bob');
    });

    it('calculates page info correctly', async () => {
      const provider = new StaticDataProvider(users, { applyPagination: true });

      const result = await provider.load({
        pagination: { pageIndex: 0, pageSize: 2 },
      });

      expect(result.pageInfo).toBeDefined();
      expect(result.pageInfo?.pageIndex).toBe(0);
      expect(result.pageInfo?.pageSize).toBe(2);
      expect(result.pageInfo?.totalPages).toBe(2);
      expect(result.pageInfo?.hasNextPage).toBe(true);
      expect(result.pageInfo?.hasPreviousPage).toBe(false);
    });

    it('does not apply sorting when disabled', async () => {
      const provider = new StaticDataProvider(users, { applySorting: false });

      const result = await provider.load({
        sorting: [{ id: 'name', desc: false }],
      });

      expect(result.data).toEqual(users);
    });

    it('applies sorting before pagination', async () => {
      const provider = new StaticDataProvider(users, { 
        applySorting: true, 
        applyPagination: true 
      });

      const result = await provider.load({
        sorting: [{ id: 'name', desc: false }],
        pagination: { pageIndex: 0, pageSize: 2 },
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Alice');
      expect(result.data[1].name).toBe('Bob');
    });

    it('calculates total count before pagination', async () => {
      const provider = new StaticDataProvider(users, { applyPagination: true });

      const result = await provider.load({
        pagination: { pageIndex: 0, pageSize: 2 },
      });

      expect(result.totalCount).toBe(3);
    });

    it('includes metadata with operation info', async () => {
      const provider = new StaticDataProvider(users, { 
        applySorting: true,
        applyFiltering: true 
      });

      const result = await provider.load({
        sorting: [{ id: 'name', desc: false }],
        filtering: [{ id: 'name', value: 'A', operator: 'contains' }],
      });

      expect(result.meta).toBeDefined();
      expect(result.meta?.appliedOperations).toEqual({
        sorting: true,
        filtering: true,
        search: false,
        pagination: false,
      });
    });

    it('includes duration in metadata', async () => {
      const provider = new StaticDataProvider(users);

      const result = await provider.load({});

      expect(result.meta?.duration).toBeDefined();
      expect(typeof result.meta?.duration).toBe('number');
      expect(result.meta?.duration!).toBeGreaterThan(0);
    });

    it('handles deep nested data', async () => {
      const nestedUsers = [
        {
          id: 1,
          name: 'Alice',
          profile: {
            bio: 'Developer',
            avatar: 'avatar.png',
          },
        },
      ];
      const provider = new StaticDataProvider(nestedUsers);

      const result = await provider.load({});

      expect(result.data[0].profile?.bio).toBe('Developer');
    });

    it('deep clones returned data', async () => {
      const initialData = [{ id: 1, name: 'Alice', email: 'alice@example.com', age: 30 }];
      const provider = new StaticDataProvider(initialData);
      
      const result = await provider.load({});
      result.data[0].name = 'Bob';
      
      const newData = await provider.load({});
      expect(newData.data[0].name).toBe('Alice');
    });
  });

  describe('Save Operation', () => {
    it('replaces all data', async () => {
      const provider = new StaticDataProvider(users);
      
      const newUsers: User[] = [
        { id: 4, name: 'David', email: 'david@example.com', age: 28 },
      ];
      await provider.save(newUsers);

      expect(provider.getData()).toEqual(newUsers);
      expect(provider.getData()).toHaveLength(1);
    });

    it('notifies subscribers on data change', async () => {
      const provider = new StaticDataProvider(users);
      const listener = vi.fn();

      provider.subscribe(listener);
      await provider.save(products);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].type).toBe('data:changed');
      expect(listener.mock.calls[0][0].data).toEqual(products);
    });

    it('increments version on save', async () => {
      const provider = new StaticDataProvider(users);
      
      const firstMeta = await provider.load({});
      await provider.save(products);
      const secondMeta = await provider.load({});

      expect(secondMeta.meta?.version).toBe('1');
      expect(firstMeta.meta?.version).toBe('0');
    });

    it('deep clones saved data', async () => {
      const provider = new StaticDataProvider(users);
      
      const newUsers: User[] = [
        { id: 4, name: 'David', email: 'david@example.com', age: 28 },
      ];
      await provider.save(newUsers);
      
      newUsers[0].name = 'Bob';
      
      expect(provider.getData()[0].name).toBe('David');
    });

    it('handles empty array', async () => {
      const provider = new StaticDataProvider(users);
      
      await provider.save([]);

      expect(provider.getData()).toEqual([]);
    });
  });

  describe('Public API Methods', () => {
    describe('getData', () => {
      it('returns immutable copy of data', () => {
        // Create a fresh copy of users for this test to avoid cross-test pollution
        const testUsers: User[] = [
          { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
          { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
          { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
        ];
        const provider = new StaticDataProvider(testUsers);
        
        const data = provider.getData();
        data[0].name = 'Bob';
        
        expect(provider.getData()[0].name).toBe('Charlie');
      });

      it('returns deep clone', () => {
        // Create a fresh copy of users for this test to avoid cross-test pollution
        const testUsers: User[] = [
          { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
          { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
          { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
        ];
        const provider = new StaticDataProvider(testUsers);
        
        const data = provider.getData();
        data[0].profile = { bio: 'Test', avatar: 'test.png' };
        
        expect(provider.getData()[0].profile).toBeUndefined();
      });
    });

    describe('setData', () => {
      it('replaces data', () => {
        const provider = new StaticDataProvider(users);
        
        const newUsers = [{ id: 4, name: 'David', email: 'david@example.com', age: 28 }];
        provider.setData(newUsers);

        expect(provider.getData()).toEqual(newUsers);
      });

      it('logs error if save fails', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // This should not throw
        const provider = new StaticDataProvider(users);
        provider.setData([]);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('addData', () => {
      it('adds items to existing data', () => {
        const provider = new StaticDataProvider(users);
        
        provider.addData(
          { id: 4, name: 'David', email: 'david@example.com', age: 28 }
        );

        expect(provider.getData()).toHaveLength(4);
        expect(provider.getData()[3].name).toBe('David');
      });

      it('accepts multiple items', () => {
        const provider = new StaticDataProvider(users);
        
        provider.addData(
          { id: 4, name: 'David', email: 'david@example.com', age: 28 },
          { id: 5, name: 'Eve', email: 'eve@example.com', age: 32 }
        );

        expect(provider.getData()).toHaveLength(5);
      });
    });

    describe('updateData', () => {
      it('updates matching items', () => {
        const provider = new StaticDataProvider(users);
        
        provider.updateData(
          (item) => item.id === 1,
          (item) => ({ ...item, name: 'Alice Smith' })
        );

        expect(provider.getData()[1].name).toBe('Alice Smith');
      });

      it('leaves non-matching items unchanged', () => {
        const provider = new StaticDataProvider(users);
        
        provider.updateData(
          (item) => item.id === 999,
          (item) => ({ ...item, name: 'Updated' })
        );

        expect(provider.getData()).toEqual(users);
      });

      it('updates multiple items', () => {
        const provider = new StaticDataProvider(users);
        
        provider.updateData(
          (item) => item.age < 30,
          (item) => ({ ...item, age: item.age + 1 })
        );

        expect(provider.getData()[2].age).toBe(26); // Bob
      });
    });

    describe('removeData', () => {
      it('removes matching items', () => {
        const provider = new StaticDataProvider(users);
        
        provider.removeData((item) => item.id === 1);

        expect(provider.getData()).toHaveLength(2);
        expect(provider.getData().find((u) => u.id === 1)).toBeUndefined();
      });

      it('leaves non-matching items unchanged', () => {
        const provider = new StaticDataProvider(users);
        
        provider.removeData((item) => item.id === 999);

        expect(provider.getData()).toEqual(users);
      });

      it('removes multiple items', () => {
        const provider = new StaticDataProvider(users);
        
        provider.removeData((item) => item.age >= 30);

        expect(provider.getData()).toHaveLength(1);
        expect(provider.getData()[0].name).toBe('Bob');
      });
    });

    describe('clearData', () => {
      it('removes all data', () => {
        const provider = new StaticDataProvider(users);
        
        provider.clearData();

        expect(provider.getData()).toEqual([]);
      });
    });
  });

  describe('Subscribe/Unsubscribe', () => {
    it('notifies on save', async () => {
      const provider = new StaticDataProvider(users);
      const listener = vi.fn();

      provider.subscribe(listener);
      await provider.save(products);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'data:changed',
          data: products,
        })
      );
    });

    it('can unsubscribe', async () => {
      const provider = new StaticDataProvider(users);
      const listener = vi.fn();

      const unsubscribe = provider.subscribe(listener);
      unsubscribe();
      await provider.save(products);

      expect(listener).not.toHaveBeenCalled();
    });

    it('handles multiple subscribers', async () => {
      const provider = new StaticDataProvider(users);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      provider.subscribe(listener1);
      provider.subscribe(listener2);
      await provider.save(products);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('ignores errors in listeners', async () => {
      const provider = new StaticDataProvider(users);
      
      const listener = vi.fn();
      provider.subscribe(() => {
        throw new Error('Listener error');
      });
      provider.subscribe(listener);
      
      await provider.save(products);

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Cancel', () => {
    it('aborts pending operations', () => {
      const provider = new StaticDataProvider(users);
      const abortController = new AbortController();
      
      provider.cancel();
      
      expect(abortController.signal.aborted).toBe(false);
    });

    it('resets abort controller', () => {
      const provider = new StaticDataProvider(users);
      
      provider.cancel();
      provider.cancel();
      
      expect(provider).toBeDefined();
    });
  });

  describe('Meta', () => {
    it('returns correct provider name', () => {
      const provider = new StaticDataProvider(users);
      
      expect(provider.meta.name).toBe('StaticDataProvider');
    });

    it('returns correct version', () => {
      const provider = new StaticDataProvider(users);
      
      expect(provider.meta.version).toBe('1.0.0');
    });

    it('returns capabilities based on options', () => {
      const provider = new StaticDataProvider(users, {
        applySorting: true,
        applyFiltering: true,
        applySearch: true,
        applyPagination: true,
      });
      
      expect(provider.meta.capabilities).toEqual(
        expect.objectContaining({
          canLoad: true,
          canSave: true,
          canSubscribe: true,
          supportsSorting: true,
          supportsFiltering: true,
          supportsSearch: true,
          supportsPagination: true,
          supportsBatch: true,
          supportsTransactions: false,
          supportsCaching: false,
        })
      );
    });

    it('returns features', () => {
      const provider = new StaticDataProvider(users);
      
      expect(provider.meta.features).toEqual(
        expect.objectContaining({
          realtime: false,
          offline: true,
          conflictResolution: false,
          validation: false,
          encryption: false,
          compression: false,
          queryOptimization: false,
        })
      );
    });
  });

  describe('Large Dataset Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: Math.floor(Math.random() * 100),
      }));

      const startTime = performance.now();
      const provider = new StaticDataProvider(largeData);
      const result = await provider.load({});
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.data).toHaveLength(10000);
    });

    it('loads paginated large dataset efficiently', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: Math.floor(Math.random() * 100),
      }));

      const startTime = performance.now();
      const provider = new StaticDataProvider(largeData, { applyPagination: true });
      const result = await provider.load({
        pagination: { pageIndex: 0, pageSize: 100 },
      });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.data).toHaveLength(100);
    });
  });

  describe('Factory Functions', () => {
    it('createStaticProvider creates provider', () => {
      const provider = StaticDataProvider.create(users);
      
      expect(provider).toBeInstanceOf(StaticDataProvider);
      expect(provider.getData()).toEqual(users);
    });

    it('staticProvider creates provider', () => {
      const provider = StaticDataProvider.static(users);
      
      expect(provider).toBeInstanceOf(StaticDataProvider);
    });
  });
});
