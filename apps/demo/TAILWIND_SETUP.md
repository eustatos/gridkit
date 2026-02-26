# Tailwind CSS Setup Guide

This document describes the Tailwind CSS configuration for the GridKit Demo application.

## Overview

The demo app uses **Tailwind CSS v4** for styling, providing a modern, utility-first CSS framework that enables rapid UI development.

## Configuration Files

### `tailwind.config.js`

The main Tailwind configuration file includes:

- **Custom theme extensions**:
  - Font families (Inter for sans-serif, JetBrains Mono for code)
  - Brand colors (blue palette from 50-900)
  - Custom animations (fade-in, slide-up, pulse-slow)
  - Animation keyframes

### `postcss.config.js`

Configures PostCSS with:
- `@tailwindcss/postcss` - Tailwind's PostCSS plugin for v4
- `autoprefixer` - Automatic vendor prefixing

### `src/index.css`

The main stylesheet with three layers:

1. **Base Layer** (`@layer base`)
   - Global resets and defaults
   - Font smoothing
   - Body and root element styles

2. **Component Layer** (`@layer components`)
   - Reusable component classes:
     - `.btn`, `.btn-primary`, `.btn-secondary` - Button variants
     - `.card`, `.card-dark` - Card containers
     - `.table-header`, `.table-cell` - Table elements
     - `.badge-*` - Status badges
     - `.input` - Form inputs

3. **Utilities Layer** (`@layer utilities`)
   - Custom utility classes:
     - `.text-balance` - Balanced text wrapping
     - `.scrollbar-thin` - Custom scrollbar styling

## Usage

### Import in React Components

```tsx
import './index.css'

function MyComponent() {
  return (
    <div className="card">
      <h2 className="text-xl font-bold">Hello</h2>
      <button className="btn-primary">Click me</button>
    </div>
  )
}
```

### Using Custom Components

```tsx
// Buttons
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>

// Cards
<div className="card">Light card</div>
<div className="card-dark">Dark card</div>

// Badges
<span className="badge-success">Success</span>
<span className="badge-danger">Danger</span>
<span className="badge-warning">Warning</span>
```

### Dark Mode

The app supports manual dark mode toggling:

```tsx
const [darkMode, setDarkMode] = useState(false)

return (
  <div className={darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}>
    {/* Content */}
  </div>
)
```

## Custom Animations

Pre-configured animations are available:

- `animate-fade-in` - Quick fade in
- `animate-slide-up` - Slide up with fade
- `animate-pulse-slow` - Slow pulsing effect

## Build Process

Tailwind CSS is processed through Vite:

```bash
# Development
pnpm dev

# Production build
pnpm build
```

## File Structure

```
apps/demo/
├── src/
│   ├── index.css          # Main Tailwind stylesheet
│   ├── DemoApp.tsx        # Demo application
│   └── main.tsx           # Entry point
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies
```

## Dependencies

- `tailwindcss` ^4.2.1
- `@tailwindcss/postcss` ^4.2.1
- `autoprefixer` ^10.24.0
- `postcss` ^8.5.6

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground
- [Heroicons](https://heroicons.com/) - SVG icons
- [Tailwind UI](https://tailwindui.com/) - Component examples

## Migration Notes (v3 → v4)

Key changes in the v4 configuration:

1. Import syntax: `@import 'tailwindcss'` instead of `@tailwind` directives
2. CSS-first configuration approach
3. Improved performance with Oxide engine
4. New `@layer` syntax for custom styles
