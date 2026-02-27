# GridKit

> Enterprise-grade table library for handling large datasets

[![Status](https://img.shields.io/badge/status-in_development-yellow.svg)](https://github.com/gridkit/gridkit)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚧 Status: Phase 1 - Foundation

**Current Phase:** Core Implementation
**Progress:** 85% Complete
**Next Milestone:** v0.1.0 MVP

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@gridkit/core](./packages/core) | 0.0.1 | Core table functionality |
| [@gridkit/data](./packages/data) | 0.0.1 | Data providers |
| [@gridkit/devtools](./packages/devtools) | 0.0.1 | Browser DevTools extension |
| [@gridkit/plugins](./packages/plugins) | 0.0.1 | Official plugin ecosystem |
| [@gridkit/tanstack-adapter](./packages/tanstack-adapter) | 0.0.1 | TanStack Table adapter |

## 🎯 Key Features

- 🚀 **Performance First:** Handle 100k+ rows with virtual scrolling
- 🎨 **Framework Agnostic:** Core library works with any framework
- 📦 **Tree Shakeable:** Only bundle what you use
- 🔒 **Type Safe:** Full TypeScript support with strict mode
- 🎭 **Headless:** Complete control over UI rendering
- 🔌 **Extensible:** Plugin system for custom features
- 🛠️ **DevTools:** Built-in debugging tools

## 🏗️ Architecture

```
@gridkit/
├── core/          # Framework-agnostic core (~18KB)
├── data/          # Data providers (REST, GraphQL, etc.)
├── devtools/      # Browser DevTools extension
├── plugins/       # Official plugin ecosystem
├── tanstack-adapter/  # TanStack Table integration
├── react/         # React adapter (planned)
└── vue/           # Vue adapter (planned)
```

## 📚 Documentation

- [Getting Started](./docs/guides/getting-started.md) - Quick start guide
- [Installation](./docs/guides/installation.md) - Install and setup
- [API Reference](./docs/api/core.md) - Complete API documentation
- [Architecture](./docs/architecture/ARCHITECTURE.md) - System design
- [Implementation Status](./docs/IMPLEMENTATION_STATUS.md) - Current progress

## 🚀 Quick Start

```typescript
import { createTable } from '@gridkit/core';

// Installation
npm install @gridkit/core

// Usage
const table = createTable({
  columns,
  data,
  debug: {
    performance: true,
    events: true,
  },
});
```

## 🛠️ Development

### Prerequisites

- Node.js >= 16.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Clone repository
git clone https://github.com/gridkit/gridkit.git
cd gridkit

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Monorepo Structure

This project uses:
- **pnpm workspaces** for package management
- **Turbo** for build orchestration
- **Changesets** for versioning
- **TypeScript** with strict mode
- **Vitest** for testing
- **ESLint + Prettier** for code quality

## 📋 Current Focus

**Phase 1: Foundation** (85% Complete)

**Completed:**
- ✅ Type system with branded types
- ✅ Event system with middleware
- ✅ State management
- ✅ Column system
- ✅ Row system with cell caching
- ✅ Plugin system with isolation
- ✅ Performance monitoring
- ✅ Validation system
- ✅ Data providers
- ✅ DevTools extension

**Remaining:**
- ⚠️ Fix TypeScript errors
- ⚠️ Add state module tests
- ⚠️ Fix performance test timing

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

### Quick Links

- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture](./docs/architecture/ARCHITECTURE.md)
- [Implementation Status](./docs/IMPLEMENTATION_STATUS.md)
- [Demo App Guide](./docs/guides/demo-app.md)

## 📄 License

MIT © GridKit Team

## 🔗 Links

- [Documentation](./docs/)
- [Roadmap](./docs/IMPLEMENTATION_STATUS.md)
- [Changelog](./CHANGELOG.md) (coming soon)

---

**Built with ❤️ and ⚡ AI-accelerated development**
