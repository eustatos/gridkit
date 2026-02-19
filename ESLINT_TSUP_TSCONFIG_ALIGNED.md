# ESLint Configuration Alignment

## Summary
Updated ESLint configurations to align with TypeScript compiler (tsconfig) and tsup bundler settings.

## Changes Made

### 1. packages/core/.eslintrc.json

#### Updated `parserOptions`:
- **ecmaVersion**: Changed from `2020` to `2021` to match `tsconfig.base.json` target
- **project**: Changed from string to array for type-checking support
- **tsconfigRootDir**: Added to properly resolve tsconfig path

#### Added `settings`:
```json
"settings": {
  "import/resolver": {
    "typescript": true,
    "node": true
  }
}
```
- Enables proper resolution of TypeScript path aliases (`@/*`)
- Supports both ESM and CJS module systems (tsup builds both)

#### Updated `rules`:
- Added `import/no-extraneous-dependencies`: Ensures dev dependencies are only in test files
- Added `import/no-unresolved`: Ignores `@/` and `@gridkit/` path aliases

### 2. packages/data/.eslintrc.json (NEW)

Created new ESLint configuration following the same pattern as core package:
- Same ecmaVersion and TypeScript compiler alignment
- Import resolver configured for TypeScript
- Extra rule to ignore `@gridkit/*` workspace dependencies

### 3. package.json scripts

Updated lint scripts in both packages:
- Changed from `eslint src --ext .ts` to `eslint .` (new config format)
- Changed from `eslint src --ext .ts --fix` to `eslint . --fix`

## Alignment with Other Configs

### tsconfig.base.json:
- ✓ `target: ES2021` matches `ecmaVersion: 2021`
- ✓ `moduleResolution: "bundler"` supported by TypeScript ESLint
- ✓ Path aliases (`@/*`) resolved via import/resolver-typescript

### tsup.config.ts:
- ✓ ESM/CJS support handled by import resolver
- ✓ No conflicts with tsup build configuration

## Packages Updated
1. `packages/core`
2. `packages/data`

## Verification
Run lint to verify configuration:
```bash
cd packages/core && npm run lint
cd packages/data && npm run lint
```

## Notes
- ESLint v8.x uses legacy `.eslintrc.*` format (not flat config)
- `eslint-import-resolver-typescript` package is required
- All type-checking rules work with `project` array in parserOptions
