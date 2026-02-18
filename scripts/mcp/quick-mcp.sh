#!/bin/bash
# Quick MCP utility script
# Usage: ./quick-mcp.sh <tool> <file> <line> [column]

TOOL=$1
FILE=$2
LINE=$3
COLUMN=${4:-1}

if [ -z "$TOOL" ] || [ -z "$FILE" ] || [ -z "$LINE" ]; then
    echo "Usage: ./scripts/mcp/quick-mcp.sh <tool> <file> <line> [column]"
    echo "Tools: get-definition, get-hover, get-references, analyze"
    exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
MCP_PATH="$PROJECT_ROOT/ts-language-mcp/dist/index.js"

if [ ! -f "$MCP_PATH" ]; then
    echo "Error: ts-language-mcp not found at $MCP_PATH"
    echo "Please build it first: cd ts-language-mcp && npm run build"
    exit 1
fi

# Convert file path to be relative to project root
FILE_PATH="$FILE"

node -e "
const { spawn } = require('child_process');
const path = require('path');

const mcpPath = path.normalize(process.env.MCP_PATH || '$MCP_PATH');
const projectRoot = path.normalize(process.env.PROJECT_ROOT || '$PROJECT_ROOT');

const child = spawn('node', [mcpPath, projectRoot], { stdio: ['pipe', 'pipe', 'pipe'] });

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: '$TOOL',
    arguments: {
      file: '$FILE_PATH',
      line: parseInt('$LINE'),
      column: parseInt('$COLUMN')
    }
  }
};

child.stdin.write(JSON.stringify(request) + '\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => output += data.toString());
child.stderr.on('data', (data) => console.error('Server:', data.toString()));

child.on('close', (code) => {
  try {
    const response = JSON.parse(output);
    if (response.result?.content?.[0]) {
      const result = JSON.parse(response.result.content[0].text);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('No data available');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(code);
});
"
