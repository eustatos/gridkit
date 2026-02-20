---
task_id: REACT-004
epic_id: EPIC-REACT
module: @gridkit/react
priority: P0
complexity: low
estimated_tokens: ~7,000
assignable_to_ai: yes
dependencies:
  - REACT-001
  - REACT-002
  - REACT-003
guidelines:
  - .github/AI_GUIDELINES.md
  - packages/core/vitest.config.ts
---

# Task: Setup Testing Infrastructure

## Context

Configure comprehensive testing infrastructure for React hooks and components using Vitest and React Testing Library. This enables thorough testing of all React-specific functionality.

## Objectives

- [ ] Configure Vitest for React testing
- [ ] Setup React Testing Library
- [ ] Configure test environment and globals
- [ ] Create test utilities and helpers
- [ ] Setup coverage reporting
- [ ] Add test scripts to package.json

---

## Implementation Requirements

### 1. Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test APIs
    globals: true,
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/stories/**',
        'src/types/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
    
    // Include/exclude
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.storybook'],
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter
    reporters: ['verbose'],
    
    // Bail on first failure
    bail: 1,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
    },
  },
});
```

### 2. Create Test Setup File

Create `src/__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock console methods to reduce noise in tests
beforeAll(() => {
  // Only mock in non-debug mode
  if (!process.env.DEBUG) {
    global.console = {
      ...console,
      error: vi.fn(),
      warn: vi.fn(),
    };
  }
});

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
```

### 3. Create Test Utilities

Create `src/__tests__/test-utils.tsx`:

```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { RowData, ColumnDef } from '@gridkit/core';

/**
 * Custom render function that includes common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Generate test data for tables
 */
export function generateTestData<T extends RowData>(
  count: number,
  factory: (index: number) => T
): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

/**
 * Create simple test columns
 */
export function createTestColumns<T extends RowData>(
  keys: (keyof T)[]
): ColumnDef<T>[] {
  return keys.map((key) => ({
    id: String(key),
    accessorKey: key,
    header: String(key).charAt(0).toUpperCase() + String(key).slice(1),
  }));
}

/**
 * Wait for async operations
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock performance.now for consistent testing
 */
export function mockPerformanceNow() {
  let time = 0;
  const original = performance.now;
  
  performance.now = () => {
    time += 10;
    return time;
  };
  
  return () => {
    performance.now = original;
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

### 4. Create Test Fixtures

Create `src/__tests__/fixtures.ts`:

```typescript
import type { RowData, ColumnDef } from '@gridkit/core';

/**
 * Common test data interface
 */
export interface TestUser extends RowData {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
}

/**
 * Sample test users
 */
export const testUsers: TestUser[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30, active: true },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 25, active: true },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 35, active: false },
  { id: '4', name: 'Diana', email: 'diana@example.com', age: 28, active: true },
  { id: '5', name: 'Eve', email: 'eve@example.com', age: 32, active: false },
];

/**
 * Sample test columns
 */
export const testColumns: ColumnDef<TestUser>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: 'age',
    accessorKey: 'age',
    header: 'Age',
    enableSorting: true,
  },
  {
    id: 'active',
    accessorKey: 'active',
    header: 'Active',
  },
];

/**
 * Generate large dataset for performance testing
 */
export function generateLargeDataset(count: number): TestUser[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    active: i % 2 === 0,
  }));
}
```

### 5. Update package.json

Add test dependencies and scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest --ui --coverage"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/coverage-v8": "^1.2.1",
    "@vitest/ui": "^1.2.1",
    "jsdom": "^23.2.0",
    "vitest": "^1.2.1"
  }
}
```

### 6. Create Example Test

Create `src/__tests__/example.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('Testing Infrastructure', () => {
  it('should render React components', () => {
    const TestComponent = () => <div>Hello Test</div>;
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
  
  it('should have access to test utilities', () => {
    expect(render).toBeDefined();
    expect(screen).toBeDefined();
  });
  
  it('should have proper TypeScript support', () => {
    const value: string = 'test';
    expect(value).toBe('test');
  });
});
```

### 7. Update tsconfig.json

Ensure test files are included:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": [
    "src/**/*",
    "src/**/*.test.ts",
    "src/**/*.test.tsx"
  ]
}
```

### 8. Create .gitignore Updates

Add to `.gitignore`:

```
# Testing
coverage/
.nyc_output/
*.lcov
```

---

## Test Requirements

Run the example test to verify setup:

```bash
pnpm --filter @gridkit/react test
```

Expected output:
- ✅ All tests pass
- ✅ Coverage report generated
- ✅ No TypeScript errors

---

## Files to Create/Modify

- [ ] `packages/react/vitest.config.ts` - Vitest configuration
- [ ] `packages/react/src/__tests__/setup.ts` - Test setup
- [ ] `packages/react/src/__tests__/test-utils.tsx` - Test utilities
- [ ] `packages/react/src/__tests__/fixtures.ts` - Test fixtures
- [ ] `packages/react/src/__tests__/example.test.tsx` - Example test
- [ ] `packages/react/package.json` - Add dependencies and scripts
- [ ] `packages/react/tsconfig.json` - Update types
- [ ] `packages/react/.gitignore` - Add coverage directories

---

## Success Criteria

- [ ] Vitest runs without errors
- [ ] React Testing Library works
- [ ] Coverage reports generate
- [ ] Test utilities available
- [ ] Example test passes
- [ ] TypeScript types correct
- [ ] jsdom environment works
- [ ] All mocks configured

---

## Validation Steps

```bash
# Install dependencies
pnpm install

# Run tests
pnpm --filter @gridkit/react test

# Run with coverage
pnpm --filter @gridkit/react test:coverage

# Run in watch mode
pnpm --filter @gridkit/react test:watch

# Run with UI
pnpm --filter @gridkit/react test:ui

# Verify coverage thresholds
cat packages/react/coverage/coverage-summary.json
```

---

## Self-Check

- [ ] vitest.config.ts created
- [ ] Test environment is jsdom
- [ ] React Testing Library works
- [ ] Test utilities created
- [ ] Fixtures created
- [ ] Coverage thresholds set (90%)
- [ ] Example test passes
- [ ] No console errors in tests

---

## Notes for AI

- Use jsdom for React testing
- Setup @testing-library/jest-dom matchers
- Mock browser APIs (matchMedia, etc.)
- Create reusable test utilities
- Set coverage thresholds to 90%
- Include helpful fixtures
- Configure proper TypeScript types
- Add both unit and integration test support
