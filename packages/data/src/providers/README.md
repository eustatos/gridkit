# Data Providers

GridKit provides multiple data provider implementations for different use cases.

## StaticDataProvider

The `StaticDataProvider` is the default provider for GridKit and works with in-memory data arrays. It provides:

- Client-side sorting, filtering, search, and pagination
- Deep cloning for data immutability
- Event-based subscriptions for data changes
- Comprehensive error handling

### Features

- ✅ In-memory data storage
- ✅ Client-side data operations (sorting, filtering, search, pagination)
- ✅ Deep cloning for immutability
- ✅ Event subscriptions
- ✅ No external dependencies
- ✅ High performance with large datasets

### Usage

```typescript
import { StaticDataProvider } from '@gridkit/data/providers';

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

// Create provider
const provider = new StaticDataProvider(users, {
  applySorting: true,
  applyFiltering: true,
  applySearch: true,
  applyPagination: true,
});

// Load data
const result = await provider.load({
  sorting: [{ id: 'name', desc: false }],
  pagination: { pageIndex: 0, pageSize: 10 },
});

console.log(result.data); // Sorted and paginated users

// Subscribe to changes
provider.subscribe((event) => {
  console.log('Data changed:', event.type, event.data);
});

// Update data
provider.setData([...users, { id: 3, name: 'Charlie' }]);
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `applySorting` | `boolean` | `false` | Enable client-side sorting |
| `applyFiltering` | `boolean` | `false` | Enable client-side filtering |
| `applySearch` | `boolean` | `false` | Enable client-side search |
| `applyPagination` | `boolean` | `false` | Enable client-side pagination |
| `validateData` | `boolean` | `false` | Validate data on load/save |

### Factory Functions

```typescript
import { createStaticProvider, staticProvider } from '@gridkit/data/providers';

// Using createStaticProvider
const provider1 = createStaticProvider(users, { applySorting: true });

// Using staticProvider (shorthand)
const provider2 = staticProvider(users);
```

### API Reference

#### Constructor

```typescript
constructor(
  initialData: TData[] = [],
  options?: StaticProviderOptions
)
```

#### Methods

| Method | Description |
|--------|-------------|
| `load(params: LoadParams)` | Load data with optional operations |
| `save(newData: TData[])` | Replace all data |
| `getData()` | Get current data (immutable) |
| `setData(newData: TData[])` | Replace all data (async) |
| `addData(...items: TData[])` | Add items to data |
| `updateData(predicate, updater)` | Update matching items |
| `removeData(predicate)` | Remove matching items |
| `clearData()` | Clear all data |
| `subscribe(listener)` | Subscribe to data changes |
| `cancel()` | Cancel pending operations |

#### Properties

| Property | Description |
|----------|-------------|
| `meta` | Provider metadata (name, version, capabilities, features) |

### Performance

- Handles 10,000+ rows efficiently
- Deep cloning only when necessary
- Memory-efficient pagination

### Tests

Run tests with:
```bash
pnpm test
```

### License

MIT
