const fs = require('fs')
const path = require('path')

const distPath = path.resolve(__dirname, '../dist')
const extensionPath = path.resolve(__dirname, '../extension')
const distExtensionPath = path.resolve(__dirname, '../dist/extension')

// Ensure dist/extension directory exists
if (!fs.existsSync(distExtensionPath)) {
  fs.mkdirSync(distExtensionPath, { recursive: true })
}

// Copy JS files from dist to dist/extension
console.log('Copying JS files to dist/extension...')
const jsFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.js'))
jsFiles.forEach(file => {
  fs.copyFileSync(path.resolve(distPath, file), path.resolve(distExtensionPath, file))
  console.log(`  Copied: ${file}`)
})

// Copy HTML files
console.log('Copying HTML files...')
const htmlFiles = fs.readdirSync(extensionPath).filter(f => f.endsWith('.html'))
htmlFiles.forEach(file => {
  fs.copyFileSync(path.resolve(extensionPath, file), path.resolve(distExtensionPath, file))
  console.log(`  Copied: ${file}`)
})

// Copy icons
console.log('Copying icons...')
if (fs.existsSync(path.resolve(extensionPath, 'icons'))) {
  if (fs.existsSync(path.resolve(distExtensionPath, 'icons'))) {
    fs.rmSync(path.resolve(distExtensionPath, 'icons'), { recursive: true, force: true })
  }
  fs.cpSync(path.resolve(extensionPath, 'icons'), path.resolve(distExtensionPath, 'icons'), { recursive: true })
  console.log('  Copied: icons/')
}

// Copy manifest
console.log('Copying manifest...')
fs.copyFileSync(path.resolve(extensionPath, 'manifest.json'), path.resolve(distExtensionPath, 'manifest.json'))
console.log('  Copied: manifest.json')

// Copy panel directory (but not .d.ts files)
console.log('Copying panel...')
if (fs.existsSync(path.resolve(distExtensionPath, 'panel'))) {
  fs.rmSync(path.resolve(distExtensionPath, 'panel'), { recursive: true, force: true })
}
fs.cpSync(path.resolve(extensionPath, 'panel'), path.resolve(distExtensionPath, 'panel'), { recursive: true })
console.log('  Copied: panel/')

// Copy built panel/index.js from dist/panel to dist/extension/panel
console.log('Copying panel/index.js...')
if (fs.existsSync(path.resolve(distPath, 'panel/index.js'))) {
  fs.copyFileSync(
    path.resolve(distPath, 'panel/index.js'),
    path.resolve(distExtensionPath, 'panel/index.js')
  )
  console.log('  Copied: panel/index.js')
}

// Copy styles directory
console.log('Copying styles...')
if (fs.existsSync(path.resolve(distExtensionPath, 'styles'))) {
  fs.rmSync(path.resolve(distExtensionPath, 'styles'), { recursive: true, force: true })
}
fs.cpSync(path.resolve(extensionPath, 'styles'), path.resolve(distExtensionPath, 'styles'), { recursive: true })
console.log('  Copied: styles/')

console.log('Extension files copied successfully!')
