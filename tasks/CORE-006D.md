Вы абсолютно правы! Интеграция React напрямую в ядро противоречит **фреймворк-независимой архитектуре**. Мне нужно переосмыслить архитектуру UI интеграции. Вот исправленная задача:

# CORE-006D: Plugin UI Integration - Framework-Agnostic Slot System

## 🎯 Goal

Implement a framework-agnostic UI integration system using a slot-based architecture that allows plugins to register UI components without coupling to any specific framework.

## 📋 What to implement

### 1. Slot-Based UI System

- Define `UISlot` interface for framework-agnostic component registration
- Create `SlotRegistry` for managing UI slots across plugins
- Implement priority-based slot rendering order
- Add slot lifecycle management (mount/unmount)

### 2. Component Descriptor System

- Create `ComponentDescriptor` interface for framework-independent component definition
- Support multiple rendering strategies:
  - DOM-based rendering (for vanilla JS)
  - Framework adapters (React/Vue/Angular/Svelte via separate packages)
  - Custom renderers
- Add component props validation without framework coupling

### 3. UI Event Bridge

- Bridge between UI events and plugin event system
- Framework-agnostic event handling
- DOM event delegation for performance
- Custom event system for non-DOM environments

### 4. Styling System (Framework-Agnostic)

- CSS class name generation and management
- Theme propagation via CSS custom properties
- Style isolation to prevent conflicts
- Dynamic style injection/removal

## 🚫 What NOT to do

- Do NOT import any UI framework in core
- Do NOT implement framework-specific rendering
- Do NOT add React/Vue/Angular dependencies
- Do NOT create framework-specific APIs
- Keep everything framework-agnostic

## 📁 File Structure

```
packages/core/src/plugin/
├── ui/
│   ├── SlotRegistry.ts      # Slot management (framework-agnostic)
│   ├── ComponentDescriptor.ts # Framework-independent component definition
│   └── UIRenderer.ts        # Abstract renderer interface
├── styling/
│   ├── StyleManager.ts      # CSS class/theme management
│   └── ThemeRegistry.ts     # Theme propagation
├── events/
│   └── UIEventBridge.ts     # Bridge UI events → plugin events
└── UIPluginExtension.ts    # UI extension for plugins
```

## 🧪 Test Requirements

- [ ] Slot registration: Plugins can register components in slots
- [ ] Priority system: Components render in correct order
- [ ] Framework agnostic: No React/Vue/Angular imports
- [ ] Event bridging: UI events trigger plugin events
- [ ] Styling: CSS classes and themes work
- [ ] Lifecycle: Slot components mount/unmount correctly
- [ ] Performance: < 1ms overhead for slot resolution
- [ ] Extensibility: Framework adapters can extend the system

## 💡 Implementation Example

```typescript
// ui/ComponentDescriptor.ts
export interface ComponentDescriptor<TProps = Record<string, any>> {
  /** Unique component identifier */
  readonly id: string;

  /** Component type identifier for framework adapters */
  readonly type: string;

  /** Default props */
  readonly defaultProps?: Readonly<TProps>;

  /** Component metadata */
  readonly meta?: {
    displayName?: string;
    description?: string;
    version?: string;
  };

  /** Framework-specific data (opaque to core) */
  readonly frameworkData?: unknown;
}

// ui/SlotRegistry.ts
export interface UISlot {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly allowedComponents?: string[]; // Component type restrictions
}

export class SlotRegistry {
  private slots = new Map<string, UISlot>();
  private slotComponents = new Map<
    string,
    Array<{
      pluginId: string;
      component: ComponentDescriptor;
      priority: number;
      enabled: boolean;
    }>
  >();

  registerSlot(slot: UISlot): void {
    if (this.slots.has(slot.id)) {
      throw new Error(`Slot ${slot.id} already registered`);
    }
    this.slots.set(slot.id, slot);
  }

  registerComponent(
    slotId: string,
    pluginId: string,
    component: ComponentDescriptor,
    options?: { priority?: number }
  ): () => void {
    if (!this.slots.has(slotId)) {
      throw new Error(`Slot ${slotId} not found`);
    }

    const slot = this.slots.get(slotId)!;
    if (
      slot.allowedComponents &&
      !slot.allowedComponents.includes(component.type)
    ) {
      throw new Error(
        `Component type ${component.type} not allowed in slot ${slotId}`
      );
    }

    if (!this.slotComponents.has(slotId)) {
      this.slotComponents.set(slotId, []);
    }

    const entry = {
      pluginId,
      component,
      priority: options?.priority ?? 0,
      enabled: true,
    };

    const components = this.slotComponents.get(slotId)!;
    components.push(entry);
    components.sort((a, b) => b.priority - a.priority);

    // Return unregister function
    return () => {
      const idx = components.findIndex(
        (c) => c.pluginId === pluginId && c.component.id === component.id
      );
      if (idx > -1) {
        components.splice(idx, 1);
      }
    };
  }

  getComponentsForSlot(slotId: string): Array<ComponentDescriptor> {
    const entries = this.slotComponents.get(slotId);
    if (!entries) return [];

    return entries
      .filter((entry) => entry.enabled)
      .map((entry) => entry.component);
  }
}

// styling/StyleManager.ts
export class StyleManager {
  private stylesheets = new Map<string, HTMLStyleElement>();
  private classPrefix = 'gk-';

  generateClassName(component: string, variant?: string): string {
    let className = `${this.classPrefix}${component}`;
    if (variant) {
      className += `-${variant}`;
    }
    return className;
  }

  injectCSS(css: string, id: string): void {
    // Create or update style element
    let style = this.stylesheets.get(id);
    if (!style) {
      style = document.createElement('style');
      style.id = `gk-style-${id}`;
      document.head.appendChild(style);
      this.stylesheets.set(id, style);
    }
    style.textContent = css;
  }

  removeCSS(id: string): void {
    const style = this.stylesheets.get(id);
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    this.stylesheets.delete(id);
  }
}
```

## 🔗 Dependencies

- CORE-006A (Plugin System Foundation) - Required
- CORE-006B (Configuration) - For UI configuration
- DOM APIs (optional - can work without DOM)

## 📊 Success Criteria

- Zero framework dependencies in core
- < 1KB additional bundle size for UI system
- Framework adapters can be implemented separately
- Works in non-DOM environments (SSR, workers)
- Complete CSS isolation between plugins
- All UI components removable without memory leaks

## 🌐 Framework Adapters (Separate Packages)

```
@gridkit/ui-react      # React adapter (uses SlotRegistry)
@gridkit/ui-vue        # Vue adapter
@gridkit/ui-angular    # Angular adapter
@gridkit/ui-svelte     # Svelte adapter
@gridkit/ui-dom        # Vanilla DOM renderer
```

**Adapter pattern:**

```typescript
// @gridkit/ui-react
export class ReactSlotRenderer {
  constructor(private slotRegistry: SlotRegistry) {}

  renderSlot(slotId: string): React.ReactNode {
    const components = this.slotRegistry.getComponentsForSlot(slotId);
    return components.map(component => (
      <ReactComponentAdapter
        key={component.id}
        descriptor={component}
      />
    ));
  }
}
```

Это сохраняет архитектурную чистоту и позволяет реализовать UI интеграцию через отдельные пакеты адаптеров.
