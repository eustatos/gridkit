import { atom, createStore } from "./packages/core/src/index";

const store = createStore();
const baseAtom = atom(5);
const doubleAtom = atom((get) => get(baseAtom) * 2);
const tripleDoubleAtom = atom((get) => get(doubleAtom) * 3);

console.log('Before reading tripleDoubleAtom:');
console.log('  baseAtom dependents:', (baseAtom as any).dependents);
console.log('  doubleAtom dependents:', (doubleAtom as any).dependents);

const result1 = store.get(tripleDoubleAtom);
console.log('After reading tripleDoubleAtom:');
console.log('  result1:', result1);
console.log('  baseAtom dependents:', (baseAtom as any).dependents);
console.log('  doubleAtom dependents:', (doubleAtom as any).dependents);

store.set(baseAtom, 10);

const result2 = store.get(tripleDoubleAtom);
console.log('After setting baseAtom to 10:');
console.log('  result2:', result2);
console.log('  expected:', 60);
