# Contributing to GridKit

Thank you for your interest in contributing to GridKit! This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing Standards](#testing-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

**Our Standards:**
- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

---

## Getting Started

### Prerequisites

- **Node.js** >= 16.0
- **pnpm** >= 8.0 (recommended) or npm >= 9.0
- **TypeScript** >= 5.0
- **Git** >= 2.0

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/gridkit.git
cd gridkit

# Add upstream remote
git remote add upstream https://github.com/gridkit/gridkit.git
```

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter @gridkit/core
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## Development Setup

### Project Structure

```
gridkit/
├── packages/
│   ├── core/           # @gridkit/core
│   ├── data/           # @gridkit/data
│   ├── features/       # @gridkit/features
│   ├── react/          # @gridkit/react
│   └── vue/            # @gridkit/vue
├── examples/           # Example applications
├── docs/               # Documentation
└── scripts/            # Build scripts
```

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Follow code style guidelines
   - Write tests
   - Update documentation

3. **Run checks**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(core): add feature X"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

---

## Code Style

### TypeScript

**Type Safety:**
```typescript
// ✅ DO: Use explicit types
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // ...
}

// ❌ DON'T: Use implicit any
export function createTable(options) {
  // ...
}
```

**Type vs Interface:**
```typescript
// ✅ Use 'type' for unions, intersections, utilities
type Status = 'idle' | 'loading' | 'success' | 'error';
type Props = BaseProps & AdditionalProps;

// ✅ Use 'interface' for object shapes that can be extended
interface TableOptions<TData> {
  columns: Column<TData>[];
  data: TData[];
}
```

### Naming Conventions

**Files:**
```
kebab-case.ts          ✅ column-helper.ts
camelCase.ts           ❌ columnHelper.ts
PascalCase.ts          ❌ ColumnHelper.ts
```

**Types and Interfaces:**
```typescript
PascalCase             ✅ ColumnDef, TableOptions
camelCase              ❌ columnDef, tableOptions
```

**Functions and Variables:**
```typescript
camelCase              ✅ createTable, rowData
PascalCase             ❌ CreateTable, RowData
snake_case             ❌ create_table, row_data
```

**Constants:**
```typescript
UPPER_SNAKE_CASE       ✅ DEFAULT_PAGE_SIZE, MAX_ROWS
camelCase              ❌ defaultPageSize, maxRows
```

**Private/Internal:**
```typescript
_prefixWithUnderscore  ✅ _internalState, _computeHash
no prefix              ❌ internalState (use _ or mark @internal)
```

### Code Organization

**Function Order:**
```typescript
// 1. Type definitions
type Options = { };

// 2. Constants
const DEFAULT_VALUE = 10;

// 3. Helper functions (private)
function _helper() { }

// 4. Public exports
export function main() {
  return _helper();
}

// 5. Type exports at the end
export type { Options };
```

**Export Style:**
```typescript
// ✅ DO: Named exports
export function createTable() { }
export type { TableOptions };

// ❌ DON'T: Default exports
export default createTable;

// ✅ DO: Group exports at file bottom (in index.ts)
export { createTable } from './table';
export { createColumn } from './column';
export type { TableOptions, ColumnDef } from './types';

// ❌ DON'T: Re-export with different names
export { createTable as makeTable } from './table';
```

### Import Order

```typescript
// 1. External dependencies (alphabetically sorted)
import { useMemo } from 'react';
import { produce } from 'immer';

// 2. Internal type imports
import type { Table, Column } from '@/types';

// 3. Internal utilities
import { memo } from '@/utils';

// 4. Relative imports
import { helper } from './helper';
import type { LocalType } from './types';

// 5. Side effects (CSS, etc.) - last
import './styles.css';
```

### Comments

**JSDoc for Public API:**
```typescript
/**
 * Creates a new table instance.
 * 
 * @param options - Table configuration
 * @returns Initialized table instance
 * 
 * @example
 * ```typescript
 * const table = createTable({ columns, data });
 * ```
 */
export function createTable() { }
```

**Inline Comments:**
```typescript
// ✅ DO: Explain WHY, not WHAT
// Cache result to avoid recalculation on every render
const cached = useMemo(() => compute(), [deps]);

// ❌ DON'T: State the obvious
// Set value to 10
const value = 10;
```

---

## Testing Standards

### File Naming

```
feature.test.ts        ✅ Vitest convention
feature.spec.ts        ❌ Jest convention (don't use)
test-feature.ts        ❌ Non-standard
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Reset state, clear mocks
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('method/function name', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = createInput();
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe(expected);
    });
    
    it('should handle edge case', () => {
      expect(() => functionName(null)).toThrow();
    });
  });
});
```

### Test Naming

```typescript
// ✅ DO: Descriptive, behavior-focused
it('should return empty array when no items match filter', () => { });
it('should throw GridKitError when columns array is empty', () => { });
it('should maintain sort order after state update', () => { });

// ❌ DON'T: Vague or implementation-focused
it('works', () => { });
it('test filter', () => { });
it('calls internal method', () => { });
```

### Coverage Requirements

- **Public API:** 100% coverage (all functions, branches)
- **Internal utilities:** 90%+ coverage
- **Edge cases:** All documented edge cases must be tested
- **Error paths:** All error throws must be tested

```bash
# Check coverage
pnpm test:coverage

# Coverage must meet minimums:
# - Branches: 90%
# - Functions: 95%
# - Lines: 95%
# - Statements: 95%
```

---

## Commit Messages

### Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (deps, build config)
- **ci**: CI/CD changes

### Scope

Scope indicates which package is affected:

- **core**: @gridkit/core
- **data**: @gridkit/data
- **react**: @gridkit/react
- **vue**: @gridkit/vue
- **docs**: Documentation
- **deps**: Dependencies

### Examples

```bash
# Good commits
feat(core): add column freezing support
fix(data): resolve memory leak in REST provider
docs(api): update ColumnDef interface examples
test(core): add edge cases for column helpers
perf(data): optimize virtual scrolling for 100k rows
refactor(core): simplify state update logic

# Bad commits
update stuff
fixed bug
WIP
more changes
```

### Commit Body (optional but recommended)

```bash
git commit -m "feat(core): add column freezing support

Implements the ability to freeze columns on the left or right side
of the table. Frozen columns remain visible during horizontal scroll.

- Add freezeLeft and freezeRight column options
- Update rendering logic to handle frozen columns
- Add tests for freeze functionality

Closes #123"
```

---

## Pull Request Guidelines

### Before Creating PR

- [ ] Code follows style guidelines
- [ ] Tests pass locally (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Documentation updated (if needed)
- [ ] Changelog updated (if applicable)

### PR Title

Same format as commit messages:

```
feat(core): add column freezing support
fix(data): resolve memory leak in REST provider
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Changes Made

- Added feature X
- Fixed bug Y
- Updated documentation for Z

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Screenshots (if applicable)

[Add screenshots here]

## Breaking Changes

- [ ] None
- [ ] List breaking changes here

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings introduced

## Related Issues

Closes #123
Related to #456
```

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least 1 approval required
3. **Testing**: All tests must pass
4. **Documentation**: Must be updated if needed
5. **No Unresolved Comments**: All review comments must be addressed

### Merging

- Use **Squash and Merge** for feature branches
- Use **Rebase and Merge** for hotfixes
- Delete branch after merge

---

## Documentation

### Code Documentation

**Every public export must have JSDoc:**

```typescript
/**
 * [One-line description]
 * 
 * [Detailed description]
 * 
 * @param param - Parameter description
 * @returns Return value description
 * 
 * @example
 * ```typescript
 * // Example code
 * ```
 * 
 * @see RelatedType
 * @public
 */
```

### README Updates

Update relevant README files when:
- Adding new features
- Changing public API
- Adding new examples
- Updating installation instructions

### API Documentation

API docs are auto-generated from JSDoc comments using TypeDoc.

```bash
# Generate API docs
pnpm docs:api

# Preview docs
pnpm docs:preview
```

---

## Questions?

If you have questions:

- Check existing issues and discussions
- Ask in Discord community
- Create a discussion on GitHub
- Contact maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GridKit! 🎉
