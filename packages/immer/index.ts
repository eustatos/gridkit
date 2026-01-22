// Immer integration for nexus-state
import { produce } from 'immer';
import { atom, Atom, Store } from '@nexus-state/core';

type DraftFunction<T> = (draft: T) => void | T;

/**
 * Creates an atom with immer integration for immutable updates.
 * @template T - The type of the atom's value
 * @param {T} initialValue - The initial value of the atom
 * @returns {Atom<T>} An atom with immer integration
 * @example
 * const todosAtom = atom.immer([
 *   { id: 1, text: 'Learn nexus-state', completed: false }
 * ]);
 * 
 * // Update using immer's draft
 * store.set(todosAtom, (draft) => {
 *   draft.push({ id: 2, text: 'Learn immer', completed: false });
 * });
 */
export function immerAtom<T>(initialValue: T): Atom<T> {
  return atom(initialValue);
}

// Extend the atom function to support immer
export const atomWithImmer = Object.assign(atom, {
  immer: immerAtom,
});

/**
 * Helper function to update an atom's value using immer's produce.
 * @template T - The type of the atom's value
 * @param {Store} store - The store to use
 * @param {Atom<T>} atom - The atom to update
 * @param {DraftFunction<T>} updater - The updater function that modifies the draft
 */
export function setImmer<T>(
  store: Store,
  atom: Atom<T>,
  updater: DraftFunction<T>
): void {
  store.set(atom, produce(store.get(atom), updater));
}