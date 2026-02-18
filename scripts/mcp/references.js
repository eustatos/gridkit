#!/usr/bin/env node
/**
 * Get references to a symbol using ts-language-mcp
 * 
 * Usage:
 *   node scripts/mcp/references.js <file> <line> <column>
 *   node scripts/mcp/references.js packages/core/src/types/base.ts 45 20
 */

const { spawn } = require('child_process');
const path = require('path');

const [,, filePath, lineStr, columnStr] = process.argv;

if (!filePath || !lineStr || !columnStr) {
  console.error('Usage: node scripts/mcp/references.js <file> <line> <column>');
  console.error('Example: node scripts/mcp/references.js packages/core/src/types/base.ts 45 20');
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
    name: 'get_references',
    arguments: {
      file: filePath,
      line: parseInt(lineStr),
      column: parseInt(columnStr)
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
      console.log('\n=== References (total: ' + result.references.length + ') ===\n');
      
      // Group by kind
      const definitions = result.references.filter(r => r.kind === 'write');
      const reads = result.references.filter(r => r.kind === 'read');
      
      if (definitions.length) {
        console.log('📝 DEFINITIONS:');
        definitions.forEach((ref, i) => {
          console.log(`   ${i + 1}. ${ref.file}:${ref.line}:${ref.column}`);
        });
        console.log();
      }
      
      if (reads.length) {
        console.log('👁️  READS (' + reads.length + '):');
        reads.forEach((ref, i) => {
          console.log(`   ${i + 1}. ${ref.file}:${ref.line}:${ref.column}`);
        });
      }
    } else {
      console.log('No references found');
    }
  } catch (e) {
    console.error('Error parsing response:', e.message);
    console.error('Raw output:', output);
  }
  process.exit(code);
});