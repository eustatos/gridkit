---
task_id: REACT-016
epic_id: EPIC-REACT
module: @gridkit/react
priority: P1
complexity: medium
estimated_tokens: ~15,000
assignable_to_ai: yes
dependencies:
  - REACT-005
guidelines:
  - .github/AI_GUIDELINES.md
---

# Task: Setup Storybook for React Package

## Context

Setup Storybook as the primary interactive documentation platform for @gridkit/react. Storybook will provide live component playground, auto-generated docs, accessibility testing, and visual regression testing capabilities.

## Objectives

- [ ] Install and configure Storybook 7+
- [ ] Setup essential addons (Controls, Actions, Docs, A11y)
- [ ] Configure TypeScript support
- [ ] Create Storybook theme matching GridKit branding
- [ ] Setup auto-generated documentation
- [ ] Configure for optimal DX (hot reload, fast builds)

---

## Implementation Requirements

### 1. Install Storybook

```bash
cd packages/react
npx storybook@latest init --type react --builder vite
```

### 2. Configure Storybook

Create `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
    '@chromatic-com/storybook',
  ],
  
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out props from node_modules
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },
  
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': '/src',
        },
      },
    });
  },
  
  staticDirs: ['../public'],
};

export default config;
```

### 3. Configure Storybook Preview

Create `.storybook/preview.tsx`:

```typescript
import type { Preview } from '@storybook/react';
import React from 'react';

// Global styles for stories
import './storybook.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    
    docs: {
      toc: true,
      source: {
        type: 'dynamic',
      },
    },
    
    // Accessibility addon config
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
        ],
      },
    },
    
    // Viewport addon
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    
    // Layout
    layout: 'padded',
    
    // Options
    options: {
      storySort: {
        order: [
          'Introduction',
          'Getting Started',
          'Hooks',
          ['useTable', 'useTableState', 'useColumns', 'useRows', '*'],
          'Components',
          'Examples',
          '*',
        ],
      },
    },
  },
  
  // Global decorators
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  
  tags: ['autodocs'],
};

export default preview;
```

### 4. Create Storybook Theme

Create `.storybook/theme.ts`:

```typescript
import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  
  // Brand
  brandTitle: 'GridKit',
  brandUrl: 'https://github.com/yourusername/gridkit',
  brandImage: undefined, // Add logo URL here
  brandTarget: '_blank',
  
  // Colors
  colorPrimary: '#3b82f6', // Blue
  colorSecondary: '#8b5cf6', // Purple
  
  // UI
  appBg: '#f9fafb',
  appContentBg: '#ffffff',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 8,
  
  // Text
  textColor: '#1f2937',
  textInverseColor: '#ffffff',
  
  // Toolbar
  barTextColor: '#6b7280',
  barSelectedColor: '#3b82f6',
  barBg: '#ffffff',
  
  // Form
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1f2937',
  inputBorderRadius: 6,
  
  // Font
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontCode: '"Fira Code", "Courier New", monospace',
});
```

### 5. Create Storybook Styles

Create `.storybook/storybook.css`:

```css
/* Global styles for Storybook */

* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: 'Fira Code', 'Courier New', monospace;
}

/* Table styles for examples */
.story-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.story-table th,
.story-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.story-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.story-table tr:hover {
  background-color: #f9fafb;
}

/* Code blocks */
pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
}
```

### 6. Create Introduction Story

Create `src/stories/Introduction.mdx`:

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Introduction" />

# GridKit React

Welcome to GridKit React - a powerful, type-safe table library for React applications.

## Features

- 🎣 **Modern Hooks API** - Use familiar React patterns
- 📦 **Type-Safe** - Full TypeScript support with generics
- ⚡ **High Performance** - Optimized for large datasets
- 🧩 **Composable** - Build complex tables with simple hooks
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 🎨 **Customizable** - Style however you want

## Quick Start

```tsx
import { useTable } from '@gridkit/react';

function MyTable() {
  const { table } = useTable({
    data: myData,
    columns: myColumns,
  });
  
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>{header.renderHeader()}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>{cell.renderCell()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Navigation

- **Hooks** - Core React hooks for table management
- **Components** - Pre-built table components
- **Examples** - Real-world usage examples

## Resources

- [GitHub Repository](https://github.com/yourusername/gridkit)
- [Documentation](https://gridkit.dev)
- [NPM Package](https://npmjs.com/package/@gridkit/react)
```

### 7. Update package.json Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "storybook:serve": "serve storybook-static -p 6006"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^7.6.0",
    "@storybook/addon-essentials": "^7.6.0",
    "@storybook/addon-interactions": "^7.6.0",
    "@storybook/addon-links": "^7.6.0",
    "@storybook/addon-coverage": "^1.0.0",
    "@storybook/blocks": "^7.6.0",
    "@storybook/react": "^7.6.0",
    "@storybook/react-vite": "^7.6.0",
    "@storybook/theming": "^7.6.0",
    "@chromatic-com/storybook": "^1.0.0",
    "storybook": "^7.6.0"
  }
}
```

### 8. Create .gitignore Updates

Add to `.gitignore`:

```
# Storybook
storybook-static/
```

---

## Test Requirements

Create `src/stories/__tests__/storybook.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Storybook Configuration', () => {
  it('should have main config file', () => {
    const configPath = join(__dirname, '../../../.storybook/main.ts');
    expect(existsSync(configPath)).toBe(true);
  });
  
  it('should have preview config file', () => {
    const previewPath = join(__dirname, '../../../.storybook/preview.tsx');
    expect(existsSync(previewPath)).toBe(true);
  });
  
  it('should have theme config file', () => {
    const themePath = join(__dirname, '../../../.storybook/theme.ts');
    expect(existsSync(themePath)).toBe(true);
  });
});
```

---

## Files to Create/Modify

- [ ] `.storybook/main.ts` - Main Storybook config
- [ ] `.storybook/preview.tsx` - Preview config
- [ ] `.storybook/theme.ts` - Custom theme
- [ ] `.storybook/storybook.css` - Global styles
- [ ] `src/stories/Introduction.mdx` - Introduction page
- [ ] `package.json` - Add Storybook scripts
- [ ] `.gitignore` - Add Storybook output

---

## Success Criteria

- [ ] Storybook runs locally (`pnpm storybook`)
- [ ] All addons configured correctly
- [ ] TypeScript support works
- [ ] Auto-docs generate from JSDoc
- [ ] Accessibility tests run
- [ ] Hot reload works
- [ ] Build produces static site
- [ ] Theme matches GridKit branding

---

## Validation Steps

```bash
# Install dependencies
pnpm install

# Start Storybook
pnpm --filter @gridkit/react storybook

# Should open http://localhost:6006

# Build Storybook
pnpm --filter @gridkit/react build-storybook

# Verify build output
ls packages/react/storybook-static

# Serve static build
pnpm --filter @gridkit/react storybook:serve
```

---

## Self-Check

- [ ] Storybook starts without errors
- [ ] All addons visible and working
- [ ] TypeScript types show in docs
- [ ] Accessibility checks run
- [ ] Controls work for props
- [ ] Actions log events
- [ ] Theme looks good
- [ ] Build succeeds

---

## Notes for AI

- Use Storybook 7+ (latest version)
- Configure Vite builder for speed
- Enable accessibility addon
- Auto-generate docs from TypeScript
- Use MDX for rich documentation
- Configure controls for all props
- Add viewport addon for responsiveness
- Include coverage addon for testing
