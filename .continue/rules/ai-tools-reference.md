# AI Tools Reference

## Overview

This document describes the available tools for AI assistant to interact with the project. Each tool follows a functional programming style with typed parameters.

---

## Core AI Tools

These tools are provided by the Continue CLI for project interaction.

### `Read`

Reads a file from the filesystem.

**Parameters:**
- `filepath` (string, required) - Absolute or relative path to the file

**Returns:** File content as string

**Usage example:**
```typescript
Read({ filepath: "src/server.ts" })
```

---

### `Write`

Writes content to a file.

**Parameters:**
- `filepath` (string, required) - Absolute or relative path to the file
- `content` (string, required) - Content to write to the file

**Returns:** void

**Usage example:**
```typescript
Write({ 
  filepath: "src/new-file.ts", 
  content: "export const x = 1" 
})
```

---

### `List`

Lists files in a directory.

**Parameters:**
- `dirpath` (string, required) - Absolute or relative path to the directory

**Returns:** Array of file/directory names

**Usage example:**
```typescript
List({ dirpath: "src" })
```

---

### `Bash`

Executes a shell command.

**Parameters:**
- `command` (string, required) - Shell command to execute
- `timeout` (number, optional) - Timeout in seconds (default: 180)

**Returns:** Command output as string

**Usage example:**
```typescript
Bash({ 
  command: "npm run build", 
  timeout: 300 
})
```

---

### `Fetch`

Fetches content from a URL.

**Parameters:**
- `url` (string, required) - URL to fetch content from

**Returns:** Content as markdown string (with truncation for long content)

**Usage example:**
```typescript
Fetch({ url: "https://example.com/docs" })
```

---

### `Checklist`

Creates or updates a task checklist.

**Parameters:**
- `checklist` (string, required) - Markdown checklist string using `- [ ]` for incomplete and `- [x]` for completed tasks

**Returns:** void

**Usage example:**
```typescript
Checklist({ 
  checklist: "- [ ] task 1\n- [ ] task 2\n- [x] completed task" 
})
```

---

### `Search`

Searches the codebase using ripgrep.

**Parameters:**
- `pattern` (string, required) - Regex pattern to search for
- `path` (string, optional, default: current directory) - Directory path to search in
- `file_pattern` (string, optional) - File pattern filter (e.g., "*.ts")

**Returns:** Search results as string

**Usage example:**
```typescript
Search({ 
  pattern: "const.*=.*function", 
  path: "src",
  file_pattern: "*.ts" 
})
```

---

### `MultiEdit`

Performs multiple edits on a single file.

**Parameters:**
- `file_path` (string, required) - Absolute or relative path to the file
- `edits` (array, required) - Array of edit operations:
  - `old_string` (string, required) - Exact text to replace (must match including whitespace)
  - `new_string` (string, required) - Replacement text (must be different from old_string)
  - `replace_all` (boolean, optional, default: false) - Replace all occurrences

**Returns:** void

**Usage example:**
```typescript
MultiEdit({
  file_path: "src/file.ts",
  edits: [
    {
      old_string: "const a = 1",
      new_string: "const a = 2"
    },
    {
      old_string: "const b = 3",
      new_string: "const b = 4",
      replace_all: true
    }
  ]
})
```

---

## MCP Server Tools

The project includes an MCP (Model Context Protocol) server that provides additional code analysis capabilities.

**Configuration:** `.continue/mcpServers/new-mcp-server.yaml`

### LSP-based Tools

#### `get_definitions`

Get symbol definitions in a file (Go to Definition).

**Parameters:**
- `languageId` (string, required) - Language identifier: `"typescript"` or `"javascript"`
- `path` (string, required) - Absolute or relative path to the file
- `line` (number, required) - Line number (1-indexed)
- `character` (number, required) - Character position in line (1-indexed)

**Returns:** JSON array of definition locations

**Usage example:**
```typescript
await callMcpTool('get_definitions', {
  languageId: 'typescript',
  path: '/path/to/file.ts',
  line: 10,
  character: 5
})
```

#### `get_diagnostics`

Get diagnostic messages (errors/warnings) in a file.

**Parameters:**
- `languageId` (string, required) - Language identifier: `"typescript"` or `"javascript"`
- `path` (string, required) - Absolute or relative path to the file

**Returns:** JSON array of diagnostic messages

**Usage example:**
```typescript
await callMcpTool('get_diagnostics', {
  languageId: 'typescript',
  path: '/path/to/file.ts'
})
```

#### `get_hover`

Get hover information for a symbol.

**Parameters:**
- `languageId` (string, required) - Language identifier: `"typescript"` or `"javascript"`
- `path` (string, required) - Absolute or relative path to the file
- `line` (number, required) - Line number (1-indexed)
- `character` (number, required) - Character position in line (1-indexed)

**Returns:** JSON object with hover information or `null` if no info available

**Usage example:**
```typescript
await callMcpTool('get_hover', {
  languageId: 'typescript',
  path: '/path/to/file.ts',
  line: 10,
  character: 5
})
```

### Prompts

#### `explain_code`

Generates prompts for explaining code functionality.

**Parameters:** None

**Returns:** Chat messages with system and user prompts

**Usage example:**
```typescript
await callMcpPrompt('explain_code')
```

#### `refactor_suggestion`

Generates prompts for refactoring suggestions.

**Parameters:** None

**Returns:** Chat messages with system and user prompts

**Usage example:**
```typescript
await callMcpPrompt('refactor_suggestion')
```

#### `unit_test_generation`

Generates prompts for unit test generation.

**Parameters:** None

**Returns:** Chat messages with system and user prompts

**Usage example:**
```typescript
await callMcpPrompt('unit_test_generation')
```

#### `code_quality_report`

Generates prompts for code quality analysis reports.

**Parameters:** None

**Returns:** Chat messages with system and user prompts

**Usage example:**
```typescript
await callMcpPrompt('code_quality_report')
```

---

## Usage Guidelines

### Core AI Tools
1. **Prefer `MultiEdit`** over multiple `Write` calls when editing one file
2. **Use `Search`** instead of manual iteration with `List` for code discovery
3. **Use `Bash`** for any CLI operations (npm, tsc, git, etc.)
4. **Use `Read`** before any file modification to understand current context
5. **Use `Checklist`** to track progress on multi-step tasks

### MCP Server Tools
1. **Use LSP tools** (`get_definitions`, `get_diagnostics`, `get_hover`) for accurate language-server-based analysis
2. **Use prompts** for high-level code analysis and suggestions
3. **Always specify correct `languageId`** (`typescript` or `javascript`) for LSP tools
4. **Handle empty results** - tools may return `null` or empty arrays (e.g., no definitions found)
5. **Check error messages** - MCP tools return detailed error messages on failure

### Integration Notes
- MCP server is configured in `.continue/mcpServers/new-mcp-server.yaml`
- Server command: `node dist/server-mcp.js`
- Requires TypeScript/JavaScript LSP servers to be installed and configured
