#!/usr/bin/env node
/**
 * Find symbols using AST-based search using ts-language-mcp
 * 
 * Usage:
 *   node scripts/mcp/find.js <query> [options]
 * 
 * Options:
 *   --kinds <kinds>     Filter by kinds (e.g., interface,class,function)
 *   --scope <scope>     Search scope: project,file,directory
 *   --path <path>       Path for file/directory scope
 *   --exported          Filter to exported symbols only
 * 
 * Examples:
 *   node scripts/mcp/find.js "*Service"
 *   node scripts/mcp/find.js "ColumnDef" --kinds interface
 *   node scripts/mcp/find.js "RowData" --kinds interface --scope project --exported
 */

const { spawn } = require('child_process');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .scriptName('find')
  .usage('Usage: $0 <query> [options]')
  .positional('query', {
    describe: 'Search query (glob pattern, regex, or substring)',
    type: 'string',
    demandOption: true
  })
  .option('kinds', {
    alias: 'k',
    describe: 'Filter by symbol kinds (comma-separated)',
    type: 'string'
  })
  .option('scope', {
    alias: 's',
    describe: 'Search scope',
    choices: ['project', 'file', 'directory'],
    default: 'project'
  })
  .option('path', {
    alias: 'p',
    describe: 'Path for file/directory scope'
  })
  .option('exported', {
    alias: 'e',
    describe: 'Filter to exported symbols only',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

const { query, kinds, scope, path: searchPath, exported } = argv;

const projectRoot = path.resolve(__dirname, '../../..');
const mcpPath = path.resolve(__dirname, '../../../ts-language-mcp/dist/index.js');

const child = spawn('node', [mcpPath, projectRoot], { stdio: ['pipe', 'pipe', 'pipe'] });

const arguments = {
  query,
  kinds: kinds ? kinds.split(',').map(k => k.trim()) : undefined,
  scope,
  path: searchPath,
  exported: exported ? true : undefined
};

// Clean up undefined values
Object.keys(arguments).forEach(key => {
  if (arguments[key] === undefined) delete arguments[key];
});

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'find',
    arguments
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
      console.log('\n=== Search Results ===');
      console.log(`Found ${result.count} match${result.count !== 1 ? 'es' : ''}:\n`);
      
      result.matches?.forEach((match, i) => {
        console.log(`${i + 1}. ${match.name}`);
        console.log(`   Type: ${match.kind}`);
        console.log(`   File: ${match.file}:${match.line}:${match.column}`);
        if (match.snippet) {
          console.log(`   ${match.snippet}`);
        }
        console.log();
      });
    } else {
      console.log('No matches found');
    }
  } catch (e) {
    console.error('Error parsing response:', e.message);
    console.error('Raw output:', output);
  }
  process.exit(code);
});