# MCP Scripts

This directory contains utilities for working with `ts-language-mcp` TypeScript language server.

## ⚠️ Important Notes

**Memory Usage**: `ts-language-mcp` uses significant memory to build a full TypeScript project index. For large projects, consider:
- Using Node's memory flags: `node --max-old-space-size=8192 scripts/mcp/tool.js`
- Running MCP server as a long-lived process (for Continue integration)
- Using CLI scripts for quick, isolated queries

**Build Required**: The `ts-language-mcp` server must be built:

```bash
cd ts-language-mcp
npm install
npm run build
```

## Available Scripts

### 1. `get-definition.js` - Find symbol definitions

Jump from usage to declaration.

```bash
node scripts/mcp/get-definition.js <file> <line> <column>
```

**Example:**
```bash
node scripts/mcp/get-definition.js packages/core/src/column/factory/column-registry.ts 28 25
```

**Output:**
```json
{
  "definition": {
    "file": "packages/core/src/column/factory/column-registry.ts",
    "line": 3,
    "column": 15
  }
}
```

---

### 2. `get-hover.js` - Get type information

Get hover/type information at a position (like VS Code hover).

```bash
node scripts/mcp/get-hover.js <file> <line> <column>
```

**Example:**
```bash
node scripts/mcp/get-hover.js packages/core/src/types/base.ts 45 20
```

**Output:**
```
interface ColumnDef<TData extends RowData, TValue = unknown>

Complete column definition with type-safe accessors.
Supports both simple key access and complex computed values.
```

---

### 3. `analyze.js` - Combined analysis

Get comprehensive information about a symbol (hover, definition, references, diagnostics).

```bash
node scripts/mcp/analyze.js <file> <line> <column>
```

**Example:**
```bash
node scripts/mcp/analyze.js packages/core/src/types/base.ts 45 20
```

**Output:**
```
🔍 Type Information:
interface ColumnDef<TData extends RowData, TValue = unknown>

📍 Definition Location:
   packages/core/src/types/base.ts:32:20

📌 References (total: 15):
   1. packages/core/src/types/base.ts:32:20 (write) [definition]
   2. packages/core/src/types/base.ts:45:20 (read)

⚠️  Diagnostics (total: 0)
```

---

### 4. `find.js` - AST-based semantic search

Search for symbols using glob patterns, regex, or substring matching.

```bash
node scripts/mcp/find.js <query> [options]
```

**Options:**
- `--kinds <kinds>` - Filter by symbol kinds (comma-separated)
- `--scope <scope>` - Search scope: project, file, directory
- `--path <path>` - Path for file/directory scope
- `--exported` - Filter to exported symbols only

**Examples:**
```bash
# Find all interfaces ending with "Service"
node scripts/mcp/find.js "*Service" --kinds interface

# Find ColumnDef interface
node scripts/mcp/find.js "ColumnDef" --kinds interface

# Find all exported interfaces
node scripts/mcp/find.js "*" --kinds interface --exported
```

**Output:**
```
=== Search Results ===
Found 1 match:

1. ColumnDef
   Type: interface
   File: packages/core/src/types/column/ColumnDef.ts:32:1
   export interface ColumnDef<TData extends RowData, TValue = unknown> {
```

---

### 5. `references.js` - Find all usages

Find all references to a symbol across the project.

```bash
node scripts/mcp/references.js <file> <line> <column>
```

**Example:**
```bash
node scripts/mcp/references.js packages/core/src/types/base.ts 45 20
```

**Output:**
```
=== References (total: 15) ===

📝 DEFINITIONS:
   1. packages/core/src/types/base.ts:32:20

👁️  READS (14):
   1. packages/core/src/types/base.ts:45:20
   2. packages/core/src/column/factory/create-column.ts:18:25
```

---

### 6. `symbols.js` - List file symbols

List all symbols in a file.

```bash
node scripts/mcp/symbols.js <file>
```

**Example:**
```bash
node scripts/mcp/symbols.js packages/core/src/types/base.ts
```

**Output:**
```
=== Symbols in packages/core/src/types/base.ts ===
Total: 4 symbols

[ALIAS] (2)
  • RowData at 12:1
  • RowDataConstraint at 13:1

[INTERFACE] (1)
  • RowData at 30:1

[TYPE] (1)
  • EnsureRowData at 57:1
```

---

## Quick Testing

For quick testing, use the shell wrapper:

```bash
# Get definition
./scripts/mcp/quick-mcp.sh get-definition packages/core/src/types/base.ts 45 20

# Get hover
./scripts/mcp/quick-mcp.sh get-hover packages/core/src/types/base.ts 45 20

# Get references  
./scripts/mcp/quick-mcp.sh get-references packages/core/src/types/base.ts 45 20

# Analyze position
./scripts/mcp/quick-mcp.sh analyze_position packages/core/src/types/base.ts 45 20
```

---

## Integration with Continue

Add MCP server to your `.continue/config.json`:

```json
{
  "mcpServers": {
    "typescript": {
      "command": "node",
      "args": [
        "/path/to/ts-language-mcp/dist/index.js",
        "/path/to/gridkit"
      ]
    }
  }
}
```

## Troubleshooting

### Memory errors (JavaScript heap out of memory)

Increase Node.js memory limit:

```bash
node --max-old-space-size=8192 scripts/mcp/tool.js
```

Or use the shell wrapper which handles this automatically.

### Module not found errors

Ensure TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./packages/core/src/*"]
    }
  }
}
```

### Server not starting

Verify `ts-language-mcp` is built:

```bash
cd ts-language-mcp
npm run build
```