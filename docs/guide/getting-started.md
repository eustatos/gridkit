# Getting Started

Welcome to Nexus State! This guide will help you get started with using Nexus State in your projects.

## Installation

To install Nexus State, run the following command:

```bash
npm install @nexus-state/core
```

For React integration:

```bash
npm install @nexus-state/react
```

For Vue integration:

```bash
npm install @nexus-state/vue
```

For Svelte integration:

```bash
npm install @nexus-state/svelte
```

### Additional Packages

For async operations:

```bash
npm install @nexus-state/async
```

For state families:

```bash
npm install @nexus-state/family
```

For Immer integration:

```bash
npm install @nexus-state/immer
```

For middleware:

```bash
npm install @nexus-state/middleware
```

For persistence:

```bash
npm install @nexus-state/persist
```

For CLI tools:

```bash
npm install -g @nexus-state/cli
```

For developer tools:

```bash
npm install @nexus-state/devtools
```

For Web Worker integration:

```bash
npm install @nexus-state/web-worker
```

## Basic Usage

Here's a simple example of how to use Nexus State:

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0);

// Create a store
const store = createStore();

// Get the value of the atom
console.log(store.get(countAtom)); // 0

// Update the value of the atom
store.set(countAtom, 1);

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

## Package-Specific Usage

### Async Operations

```javascript
import { createAsyncOperation } from '@nexus-state/async';

const fetchData = createAsyncOperation(async () => {
  const response = await fetch('/api/data');
  return await response.json();
});

// Execute async operation
const data = await fetchData.execute();
```

### State Families

```javascript
import { createFamily } from '@nexus-state/family';

const userFamily = createFamily({
  profile: { name: '', email: '' },
  preferences: { theme: 'light' }
});

// Access nested state
const name = userFamily.get('profile.name');
```

### Immer Integration

```javascript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({ users: [] });

// Update state with mutable API
store.setState((draft) => {
  draft.users.push({ id: 1, name: 'John' });
});
```

### Middleware

```javascript
import { createMiddleware } from '@nexus-state/middleware';

const logger = createMiddleware((action, next, store) => {
  console.log('Action:', action);
  return next(action);
});

store.use(logger);
```

### Persistence

```javascript
import { createPersist } from '@nexus-state/persist';

const persist = createPersist({
  key: 'app-state',
  storage: localStorage
});

store.use(persist);
```

## Next Steps

- Learn about [core concepts](/guide/core-concepts)
- Explore the [API reference](/api/)
- Check out [examples](/examples/)
- Try [recipes](/recipes/)
- See [package-specific examples](/recipes/package-examples)