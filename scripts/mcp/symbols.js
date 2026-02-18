#!/usr/bin/env node
/**
 * Get all symbols in a file using ts-language-mcp
 * 
 * Usage:
 *   node scripts/mcp/symbols.js <file>
 *   node scripts/mcp/symbols.js packages/core/src/types/base.ts
 */

const { spawn } = require('child_process');
const path = require('path');

const [,, filePath] = process.argv;

if (!filePath) {
  console.error('Usage: node scripts/mcp/symbols.js <file>');
  console.error('Example: node scripts/mcp/symbols.js packages/core/src/types/base.ts');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '../../..');
const mcpPath = path.resolve(__dirname, '../../../ts-language-mcp/dist/index.js');

const child = spawn('node', [mcpPath, projectRoot], { stdio: ['pipe', 'pipe', 'pipe'] });

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'get_symbols',
    arguments: {
      file: filePath
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
      console.log('\n=== Symbols in ' + filePath + ' ===');
      console.log(`Total: ${result.symbols.length} symbols\n`);
      
      // Group by kind
      const groups = {};
      result.symbols.forEach(symbol => {
        if (!groups[symbol.kind]) groups[symbol.kind] = [];
        groups[symbol.kind].push(symbol);
      });
      
      Object.keys(groups).sort().forEach(kind => {
        console.log(`\n[${kind.toUpperCase()}] (${groups[kind].length})`);
        groups[kind].forEach(symbol => {
          console.log(`  • ${symbol.name} at ${symbol.line}:${symbol.column}`);
        });
      });
    } else {
      console.log('No symbols found');
    }
  } catch (e) {
    console.error('Error parsing response:', e.message);
    console.error('Raw output:', output);
  }
  process.exit(code);
});