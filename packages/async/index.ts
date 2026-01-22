// Async atom implementation for nexus-state
import { atom, Atom, Store } from '@nexus-state/core';

// Type definitions for async atom
export type AsyncAtomData<T> = {
  loading: boolean;
  error: Error | null;
  data: T | null;
};

export type AsyncAtomOptions<T> = {
  initialValue?: T;
  fetchFn: () => Promise<T>;
};

/**
 * Creates an async atom with built-in loading, error, and data states.
 * @template T - The type of the data
 * @param {AsyncAtomOptions<T>} options - Configuration options for the async atom
 * @returns {Atom<AsyncAtomData<T>>} An atom with loading, error, and data states
 * @example
 * const userAtom = atom.async({
 *   fetchFn: () => fetch('/api/user').then(res => res.json())
 * });
 */
export function asyncAtom<T>(options: AsyncAtomOptions<T>): Atom<AsyncAtomData<T>> {
  const { fetchFn, initialValue = null } = options;
  
  return atom({
    loading: false,
    error: null,
    data: initialValue,
    
    fetch: async (store: Store) => {
      // Set loading state
      store.set(asyncAtom, {
        loading: true,
        error: null,
        data: store.get(asyncAtom).data,
      });
      
      try {
        // Fetch data
        const data = await fetchFn();
        
        // Set success state
        store.set(asyncAtom, {
          loading: false,
          error: null,
          data,
        });
      } catch (error) {
        // Set error state
        store.set(asyncAtom, {
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
          data: store.get(asyncAtom).data,
        });
      }
    },
  } as AsyncAtomData<T> & { fetch: (store: Store) => Promise<void> });
}

// Extend the atom function to support async atoms
export const atomWithAsync = Object.assign(atom, {
  async: asyncAtom,
});