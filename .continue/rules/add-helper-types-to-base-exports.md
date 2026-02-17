---
globs: packages/core/src/types/base.ts
description: Export helper types from base.ts for convenient access across the codebase
alwaysApply: false
---

After the RowData interface in src/types/base.ts, add the import and export for helper types: `import type { RowDataConstraint, EnsureRowData } from './helpers'; export type { RowDataConstraint, EnsureRowData };`