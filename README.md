# GridKit

> Enterprise-grade table library for handling large datasets

[![Status](https://img.shields.io/badge/status-in_development-yellow.svg)](https://github.com/gridkit/gridkit)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚧 Status: Phase 1 - Foundation

**Current Phase:** Type System & Core Infrastructure  
**Progress:** Planning Complete → Implementation Starting  
**Next Milestone:** MVP (v0.1.0)

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@gridkit/core](./packages/core) | 0.0.1 | Core table functionality |
| [@gridkit/data](./packages/data) | 0.0.1 | Data providers |
| @gridkit/features | - | Feature modules (planned) |
| @gridkit/react | - | React adapter (planned) |
| @gridkit/vue | - | Vue adapter (planned) |

## 🎯 Key Features (Planned)

- 🚀 **Performance First:** Handle 100k+ rows with virtual scrolling
- 🎨 **Framework Agnostic:** Core library works with any framework
- 📦 **Tree Shakeable:** Only bundle what you use
- 🔒 **Type Safe:** Full TypeScript support with strict mode
- 🎭 **Headless:** Complete control over UI rendering
- 🔌 **Extensible:** Plugin system for custom features

## 🏗️ Architecture

```
@gridkit/
├── core/          # Framework-agnostic core (~15kb)
├── data/          # Data providers (REST, GraphQL, etc.)
├── features/      # Features (sorting, filtering, grouping)
├── react/         # React adapter
└── vue/           # Vue adapter
```

## 📚 Documentation

- [Architecture](./docs/architecture/ARCHITECTURE.md)
- [Roadmap](./planning/ROADMAP.md)
- [Contributing](./CONTRIBUTING.md)
- [Getting Started](./START_HERE.md)

## 🚀 Quick Start (Coming Soon)

```typescript
import { createTable } from '@gridkit/core';

// Installation
npm install @gridkit/core

// Usage
const table = createTable({
  columns,
  data,
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

# Run tests in watch mode
pnpm test:watch
```

### Monorepo Structure

This project uses:
- **pnpm workspaces** for package management
- **Turbo** for build orchestration
- **Changesets** for versioning
- **TypeScript** with strict mode
- **Vitest** for testing
- **ESLint + Prettier** for code quality

## 📋 Current Tasks (Phase 1)

See [tasks/phase-1-foundation](./tasks/phase-1-foundation/) for detailed task breakdown.

**Next up:**
- [ ] CORE-001: Base TypeScript types
- [ ] CORE-002: Table interfaces
- [ ] CORE-003: Column interfaces
- [ ] CORE-004: Row interfaces

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

### For AI Agents

Please read [AI Guidelines](./.github/AI_GUIDELINES.md) before starting any work.

## 📄 License

MIT © GridKit Team

## 🔗 Links

- [Documentation](./docs/)
- [Examples](./examples/) (coming soon)
- [Roadmap](./planning/ROADMAP.md)
- [Changelog](./CHANGELOG.md) (coming soon)

---

**Built with ❤️ and ⚡ AI-accelerated development**
