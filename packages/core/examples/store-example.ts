import { createStore } from '../src/state';

// Example 1: Basic store usage
interface AppState {
  count: number;
  user: {
    name: string;
    age: number;
  } | null;
}

const store = createStore<AppState>({
  count: 0,
  user: null,
});

console.log('Initial state:', store.getState());

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State updated:', state);
});

// Update state with direct value
store.setState({
  count: 1,
  user: { name: 'Alice', age: 30 },
});

// Update state with updater function
store.setState(prev => ({
  ...prev,
  count: prev.count + 1,
}));

// Update nested state
store.setState(prev => ({
  ...prev,
  user: prev.user ? {
    ...prev.user,
    age: prev.user.age + 1,
  } : null,
}));

// Subscribe with immediate notification
store.subscribe((state) => {
  console.log('Immediate notification:', state);
}, true);

// Reset to initial state
store.reset();
console.log('After reset:', store.getState());

// Unsubscribe
unsubscribe();

// Clean up
store.destroy();

console.log('\nExample 2: Counter store');

// Example 2: Simple counter store
const counterStore = createStore(0);

counterStore.subscribe((count) => {
  console.log('Counter:', count);
}, true);

for (let i = 0; i < 5; i++) {
  counterStore.setState(prev => prev + 1);
}

counterStore.destroy();

console.log('\nAll examples completed successfully!');