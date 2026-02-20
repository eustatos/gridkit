# @gridkit/react

React adapter for GridKit table library.

## Installation

```bash
npm install @gridkit/react @gridkit/core react react-dom
# or
pnpm add @gridkit/react @gridkit/core react react-dom
# or
yarn add @gridkit/react @gridkit/core react react-dom
```

## Quick Start

```tsx
import { useTable } from '@gridkit/react';

function MyTable() {
  const table = useTable({
    data: myData,
    columns: myColumns,
  });
  
  // Render your table using the table instance
  return (
    <table>
      {/* Your table implementation */}
    </table>
  );
}
```

## Features

- 🎣 **React Hooks** - Modern hooks API for table management
- 🔄 **Reactive State** - Automatic re-renders on state changes
- 📦 **Type-Safe** - Full TypeScript support with generics
- ⚡ **Performance** - Optimized for minimal re-renders
- 🧩 **Composable** - Build complex tables with simple hooks

## Documentation

Full documentation coming soon.

## License

MIT
