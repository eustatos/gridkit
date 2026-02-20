---
task_id: REACT-003
epic_id: EPIC-REACT
module: @gridkit/react
priority: P0
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - REACT-001
  - REACT-002
guidelines:
  - .github/AI_GUIDELINES.md
  - packages/core/tsup.config.ts
---

# Task: Setup Build System (tsup + React)

## Context

Configure tsup for building the React package with proper React optimizations, external dependencies, and multiple output formats.

## Objectives

- [ ] Create tsup.config.ts for React package
- [ ] Configure external dependencies (React, ReactDOM)
- [ ] Setup multiple output formats (ESM, CJS)
- [ ] Configure source maps and declarations
- [ ] Optimize bundle size

---

## Implementation Requirements

### 1. Create tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    hooks: 'src/hooks/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false, // Let consumers minify
  
  // React-specific externals
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@gridkit/core',
  ],
  
  // Don't bundle dependencies
  noExternal: [],
  
  // Output configuration
  outDir: 'dist',
  
  // ESBuild options
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.jsxDev = false;
    options.conditions = ['module', 'import'];
  },
  
  // Banner for license
  banner: {
    js: '// @gridkit/react - React adapter for GridKit',
  },
  
  // Development mode
  watch: process.env.NODE_ENV === 'development',
  
  // Type generation
  dts: {
    resolve: true,
    entry: {
      index: 'src/index.ts',
      hooks: 'src/hooks/index.ts',
    },
  },
  
  // Platform
  platform: 'browser',
  target: 'es2022',
  
  // Ensure proper tree-shaking
  treeshake: {
    preset: 'recommended',
    moduleSideEffects: false,
  },
});
```

### 2. Update package.json with Build Scripts

```json
{
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "build:prod": "NODE_ENV=production tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist .turbo",
    "prebuild": "pnpm run clean"
  }
}
```

### 3. Add .npmignore

Create `packages/react/.npmignore`:

```
# Source files
src/

# Build artifacts
*.tsbuildinfo
.turbo/

# Development
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
__tests__/
__mocks__/
.vscode/
.idea/

# Config files
tsconfig.json
tsconfig.*.json
tsup.config.ts
vitest.config.ts
.eslintrc.json

# Misc
*.log
.DS_Store
coverage/
.nyc_output/
```

### 4. Update package.json exports

Ensure exports are configured correctly:

```json
{
  "name": "@gridkit/react",
  "version": "0.0.1",
  "description": "React adapter for GridKit table library",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./hooks": {
      "types": "./dist/hooks.d.ts",
      "import": "./dist/hooks.js",
      "require": "./dist/hooks.cjs",
      "default": "./dist/hooks.js"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

### 5. Create Build Validation Script

Create `scripts/validate-build.js`:

```javascript
#!/usr/bin/env node

import { existsSync, statSync } from 'fs';
import { join } from 'path';

const distPath = join(process.cwd(), 'dist');
const requiredFiles = [
  'index.js',
  'index.cjs',
  'index.d.ts',
  'hooks.js',
  'hooks.cjs',
  'hooks.d.ts',
];

console.log('🔍 Validating build output...\n');

let hasErrors = false;

// Check if dist directory exists
if (!existsSync(distPath)) {
  console.error('❌ dist/ directory not found');
  process.exit(1);
}

// Check required files
requiredFiles.forEach(file => {
  const filePath = join(distPath, file);
  if (!existsSync(filePath)) {
    console.error(`❌ Missing: ${file}`);
    hasErrors = true;
  } else {
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${file} (${sizeKB} KB)`);
  }
});

if (hasErrors) {
  console.error('\n❌ Build validation failed');
  process.exit(1);
} else {
  console.log('\n✅ Build validation passed');
}
```

Make it executable and add to package.json:

```json
{
  "scripts": {
    "validate": "node scripts/validate-build.js",
    "postbuild": "pnpm run validate"
  }
}
```

### 6. Add Bundle Size Analysis (Optional)

Install size-limit and add to package.json:

```json
{
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.0.1",
    "size-limit": "^11.0.1"
  },
  "size-limit": [
    {
      "name": "Full package (ESM)",
      "path": "dist/index.js",
      "import": "*",
      "limit": "50 KB"
    },
    {
      "name": "Hooks only",
      "path": "dist/hooks.js",
      "import": "*",
      "limit": "30 KB"
    }
  ],
  "scripts": {
    "size": "size-limit",
    "size:why": "size-limit --why"
  }
}
```

---

## Test Requirements

Create `src/__tests__/build.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Build Output', () => {
  const distPath = join(__dirname, '../../dist');
  
  it('should create dist directory', () => {
    expect(existsSync(distPath)).toBe(true);
  });
  
  it('should generate ESM output', () => {
    expect(existsSync(join(distPath, 'index.js'))).toBe(true);
  });
  
  it('should generate CJS output', () => {
    expect(existsSync(join(distPath, 'index.cjs'))).toBe(true);
  });
  
  it('should generate type declarations', () => {
    expect(existsSync(join(distPath, 'index.d.ts'))).toBe(true);
  });
  
  it('should generate hooks bundle', () => {
    expect(existsSync(join(distPath, 'hooks.js'))).toBe(true);
    expect(existsSync(join(distPath, 'hooks.d.ts'))).toBe(true);
  });
});
```

---

## Files to Create/Modify

- [ ] `packages/react/tsup.config.ts` - Build configuration
- [ ] `packages/react/.npmignore` - NPM publish exclusions
- [ ] `packages/react/scripts/validate-build.js` - Build validation
- [ ] `packages/react/package.json` - Update scripts and exports
- [ ] `packages/react/src/__tests__/build.test.ts` - Build tests

---

## Success Criteria

- [ ] Build completes without errors
- [ ] All required output files generated
- [ ] Bundle size is reasonable (< 50KB)
- [ ] Source maps generated
- [ ] Type declarations generated
- [ ] Tree-shaking works correctly
- [ ] No bundled React code (external)
- [ ] Validation script passes

---

## Validation Steps

```bash
# Clean build
pnpm --filter @gridkit/react clean

# Build
pnpm --filter @gridkit/react build

# Validate build output
pnpm --filter @gridkit/react validate

# Check bundle size
pnpm --filter @gridkit/react size

# Test build
pnpm --filter @gridkit/react test src/__tests__/build.test.ts

# Verify exports work
node -e "import('@gridkit/react').then(m => console.log(Object.keys(m)))"
```

---

## Self-Check

- [ ] tsup.config.ts created and configured
- [ ] Build completes successfully
- [ ] All output files present
- [ ] React is external (not bundled)
- [ ] Source maps generated
- [ ] Type declarations generated
- [ ] Validation script passes
- [ ] Bundle size under limit

---

## Notes for AI

- Keep React and ReactDOM external
- Ensure JSX transform is automatic
- Generate both ESM and CJS
- Include source maps for debugging
- Don't minify (let consumers do it)
- Validate build output automatically
- Tree-shaking must work correctly
