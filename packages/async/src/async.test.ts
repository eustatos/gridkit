// Tests for @nexus-state/async
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { atomWithAsync, asyncAtom } from '../index';

// Type definitions
type AsyncAtomData<T> = {
  loading: boolean;
  error: Error | null;
  data: T | null;
};

// Mock fetch for testing
const mockFetch = vi.fn();

global.fetch = mockFetch as any;

describe('asyncAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    mockFetch.mockReset();
  });

  it('should create an async atom with initial state', () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 'test data',
      initialValue: null,
    });

    const value = store.get(asyncAtomInstance);
    
    expect(value).toEqual({
      loading: false,
      error: null,
      data: null,
    });
    expect(value.loading).toBe(false);
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValue({
      json: async () => mockData,
    });

    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async (store) => {
        const response = await fetch('/api/test');
        return response.json();
      },
      initialValue: null,
    });

    // Initial state
    expect(store.get(asyncAtomInstance).data).toBeNull();

    // Fetch data
    await fetchFn(store);

    // Check updated state
    const value = store.get(asyncAtomInstance);
    expect(value).toEqual({
      loading: false,
      error: null,
      data: mockData,
    });
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Fetch failed');
    mockFetch.mockRejectedValue(error);

    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        throw error;
      },
      initialValue: null,
    });

    await fetchFn(store);

    const value = store.get(asyncAtomInstance);
    expect(value).toEqual({
      loading: false,
      error: error,
      data: null,
    });
  });

  it('should update loading state during fetch', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      },
      initialValue: null,
    });

    const unsubscribe = store.subscribe(asyncAtomInstance, (value) => {
      if (value.loading) {
        expect(value.data).toBeNull();
        expect(value.error).toBeNull();
      }
    });

    await fetchFn(store);
    unsubscribe();
  });

  it('should handle custom initial value', () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 'new data',
      initialValue: 'initial',
    });

    const value = store.get(asyncAtomInstance);
    expect(value).toEqual({
      loading: false,
      error: null,
      data: 'initial',
    });
  });
});

describe('atomWithAsync', () => {
  it('should extend atom function with async method', () => {
    const [asyncAtomInstance, fetchFn] = atomWithAsync.async({
      fetchFn: async () => 'test',
      initialValue: null,
    });

    expect(asyncAtomInstance).toBeDefined();
    expect(fetchFn).toBeDefined();
  });
});

describe('integration with core', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should work with computed atoms', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 10,
      initialValue: 0,
    });

    const doubleAtom = atom((get) => get(asyncAtomInstance).data * 2);

    await fetchFn(store);

    expect(store.get(doubleAtom)).toBe(20);
  });

  it('should work with multiple async atoms', async () => {
    const [atom1, fetch1] = asyncAtom({
      fetchFn: async () => 'A',
      initialValue: null,
    });

    const [atom2, fetch2] = asyncAtom({
      fetchFn: async () => 'B',
      initialValue: null,
    });

    await Promise.all([fetch1(store), fetch2(store)]);

    expect(store.get(atom1).data).toBe('A');
    expect(store.get(atom2).data).toBe('B');
  });
});
