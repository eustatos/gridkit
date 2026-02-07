import { atom } from './index';
import type { Getter } from './types';

// Debug test to understand how atom function works
const countAtom = atom(0);
console.log('Count atom type:', countAtom.type);
console.log('Count atom read function:', countAtom.read);

const doubleAtom = atom((get: Getter) => get(countAtom) * 2);
console.log('Double atom type:', doubleAtom.type);
console.log('Double atom read function:', doubleAtom.read);

// Test if read function is actually a function
console.log('Is doubleAtom.read a function?', typeof doubleAtom.read === 'function');

// Test what the read function returns
if (typeof doubleAtom.read === 'function') {
  // We can't test the actual value without a store, but we can check the function
  console.log('Double atom read function toString:', doubleAtom.read.toString());
}