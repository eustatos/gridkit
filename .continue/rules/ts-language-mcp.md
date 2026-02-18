---
globs: packages/**/*.ts
description: Use ts-language-mcp for TypeScript code analysis and navigation
alwaysApply: false
---

# ts-language-mcp Usage Guide

## What is ts-language-mcp?

A TypeScript language server that provides deep code intelligence through MCP tools. It uses TypeScript's compiler API directly (not LSP), providing zero-config integration with full type awareness.

## When to Use

✅ **Use ts-language-mcp when you need:**
- Jump to symbol definitions
- Find all usages of a symbol
- Get type information with full generic resolution
- Search symbols using AST patterns (not text search)
- Preview and execute refactors (renames)
- Get call/type hierarchies
- Analyze multiple positions efficiently
- Get project-wide diagnostics

❌ **Don't use ts-language-mcp when:**
- You only need file content (use `Read` tool)
- You need to grep for patterns (use `Search` tool)
- Simple text-based operations suffice

## Available Tools

### Navigation
- `get_definition` - Jump from usage to declaration
- `get_references` - Find all usages of a symbol
- `get_implementations` - Find implementations of interfaces

### Type Intelligence
- `get_hover` - Get type info and documentation (like VS Code hover)
- `get_signature` - Get function signature help
- `get_type_hierarchy` - Navigate class/interface inheritance

### Code Structure
- `get_symbols` - List all symbols in a file
- `get_outline` - Get hierarchical file structure
- `get_imports` - List all imports with details

### Semantic Search
- `find` - AST-based search by pattern and symbol kind
- `get_workspace_symbols` - Fast symbol search by name

### Diagnostics & Completions
- `get_diagnostics` - Get TypeScript errors/warnings for a file
- `get_all_diagnostics` - Get diagnostics for entire project
- `get_completions` - Get context-aware completions

### Refactoring
- `rename_preview` - Preview all locations that would change
- `rename_symbol` - Execute rename across the project
- `get_call_hierarchy` - Trace function calls
- `format_document` - Format file using TS formatter

### Efficiency
- `analyze_position` - Combined analysis (hover + definition + references + diagnostics)
- `batch_analyze` - Analyze multiple positions at once

## Quick Reference

### Get definition (jump to source)
```json
{
  "name": "get_definition",
  "arguments": {
    "file": "packages/core/src/column/factory/column-registry.ts",
    "line": 28,
    "column": 25
  }
}
```

### Get type information
```json
{
  "name": "get_hover",
  "arguments": {
    "file": "packages/core/src/types/base.ts",
    "line": 45,
    "column": 20
  }
}
```

### Find all usages
```json
{
  "name": "get_references",
  "arguments": {
    "file": "packages/core/src/types/base.ts",
    "line": 45,
    "column": 20
  }
}
```

### Semantic search (AST-based)
```json
{
  "name": "find",
  "arguments": {
    "query": "*Service",
    "kinds": ["interface", "class"],
    "scope": "project",
    "exported": true
  }
}
```

### Combined analysis
```json
{
  "name": "analyze_position",
  "arguments": {
    "file": "packages/core/src/types/base.ts",
    "line": 45,
    "column": 20
  }
}
```

## Usage Patterns

### 1. Understanding unfamiliar code
```json
// Start from a usage, get definition
get_definition({ file, line, column })
// → Follow definitions deeper as needed
```

### 2. Before modifying code
```json
// Find all usages first
get_references({ file, line, column })
// Review all callers to ensure compatibility
```

### 3. Investigating type issues
```json
// Get type info and diagnostics
analyze_position({ file, line, column })
// → See hover, definition, references, and diagnostics
```

### 4. Refactoring safely
```json
// Preview changes first
rename_preview({ file, line, column, newName })
// → Review all affected locations
// Then execute
rename_symbol({ file, line, column, newName })
```

## MCP Resources

- `typescript://project/config` - Compiler options
- `typescript://project/files` - List all project files
- `typescript://file/{path}` - Read file content

## CLI Scripts

For manual testing, use the CLI scripts in `scripts/mcp/`:

```bash
# Get definition
node scripts/mcp/get-definition.js packages/core/src/types/base.ts 45 20

# Get hover
node scripts/mcp/get-hover.js packages/core/src/types/base.ts 45 20

# Analyze position
node scripts/mcp/analyze.js packages/core/src/types/base.ts 45 20

# Find symbols
node scripts/mcp/find.js "ColumnDef" --kinds interface

# List symbols in file
node scripts/mcp/symbols.js packages/core/src/types/base.ts

# Get references
node scripts/mcp/references.js packages/core/src/types/base.ts 45 20
```

## Integration

The `ts-language-mcp` server is automatically started by Continue when this rule is active. No manual setup required.

## Troubleshooting

### Module resolution errors

If you see "Cannot find module" errors, ensure:
- `tsconfig.json` has correct `paths` configuration
- Project root is correctly detected
- Required dependencies are installed

### No definition found

- Check the line/column position is correct
- Ensure the symbol exists in the file
- Verify TypeScript compilation is working

### Performance issues

- Use `batch_analyze` for multiple positions
- Filter `find` queries with `kinds` and `exported`
- Use `find` with `scope: "file"` for faster searches

## See Also

- [ts-language-mcp README](../../ts-language-mcp/README.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript-wiki/blob/main/Using-the-Compiler-API.md)
