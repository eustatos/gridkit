#!/usr/bin/env node
/**
 * Analyze position (combined hover, definition, references) using ts-language-mcp
 * 
 * Usage:
 *   node scripts/mcp/analyze.js <file> <line> <column>
 *   node scripts/mcp/analyze.js packages/core/src/types/base.ts 45 20
 */

const { spawn } = require('child_process');
const path = require('path');

const [,, filePath, lineStr, columnStr] = process.argv;

if (!filePath || !lineStr || !columnStr) {
  console.error('Usage: node scripts/mcp/analyze.js <file> <line> <column>');
  console.error('Example: node scripts/mcp/analyze.js packages/core/src/types/base.ts 45 20');
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
    name: 'analyze_position',
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
      
      console.log('\n=== Analysis Results ===\n');
      
      // Hover/Type info
      if (result.hover) {
        console.log('🔍 Type Information:');
        console.log(result.hover);
        console.log();
      }
      
      // Definition
      if (result.definition) {
        console.log('📍 Definition Location:');
        console.log(`   ${result.definition.file}:${result.definition.line}:${result.definition.column}`);
        console.log();
      }
      
      // References
      if (result.references?.length) {
        console.log('📌 References (total: ' + result.references.length + '):');
        result.references.forEach((ref, i) => {
          const kind = ref.kind === 'write' ? 'write' : ref.kind === 'read' ? 'read' : ref.kind;
          const def = ref.isDefinition ? ' [definition]' : '';
          console.log(`   ${i + 1}. ${ref.file}:${ref.line}:${ref.column} (${kind})${def}`);
        });
        console.log();
      }
      
      // Diagnostics
      if (result.diagnostics?.length) {
        console.log('⚠️  Diagnostics (total: ' + result.diagnostics.length + '):');
        result.diagnostics.forEach((diag, i) => {
          const severity = diag.severity === 'error' ? '❌' : '⚠️';
          console.log(`   ${i + 1}. ${severity} ${diag.message}`);
          console.log(`      Code: ${diag.code}`);
        });
      }
    } else {
      console.log('No analysis data available');
    }
  } catch (e) {
    console.error('Error parsing response:', e.message);
    console.error('Raw output:', output);
  }
  process.exit(code);
});