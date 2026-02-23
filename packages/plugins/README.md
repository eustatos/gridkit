# @gridkit/plugins - Official Plugin Ecosystem

Official plugins for GridKit Enhanced - the enterprise-grade table solution.

## 📦 Available Plugins

### 1. Audit Log Plugin
GDPR/HIPAA/SOX compliant audit logging for all table operations.

```typescript
import { auditLogPlugin } from '@gridkit/plugins/audit-log'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    plugins: [
      auditLogPlugin({
        destination: 'https://api.example.com/audit',
        events: ['row:create', 'row:update', 'row:delete'],
        pii: {
          mask: ['email', 'ssn'],
          encrypt: ['salary']
        }
      })
    ]
  }
})
```

**Features:**
- ✅ GDPR/HIPAA/SOX compliant
- ✅ PII masking and encryption
- ✅ Customizable retention
- ✅ Event filtering

### 2. Analytics Plugin
Track user interactions with popular analytics providers.

```typescript
import { analyticsPlugin } from '@gridkit/plugins/analytics'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    plugins: [
      analyticsPlugin({
        provider: 'mixpanel',
        apiKey: 'YOUR_API_KEY',
        autoTrack: true,
        customEvents: {
          'row:select': 'Table Row Selected'
        }
      })
    ]
  }
})
```

**Features:**
- ✅ Mixpanel, Amplitude, GA, Segment support
- ✅ Auto-tracking of common events
- ✅ Custom event mapping
- ✅ Session tracking

### 3. Export Plugin
Export table data to multiple formats.

```typescript
import { exportPlugin } from '@gridkit/plugins/export'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    plugins: [
      exportPlugin({
        formats: ['csv', 'xlsx', 'pdf'],
        filename: 'table-export'
      })
    ]
  }
})

// Usage
table.exportToCSV()
table.exportToExcel()
table.exportToPDF()
```

**Features:**
- ✅ CSV, Excel, PDF, JSON support
- ✅ Filtered data export
- ✅ Custom formatting
- ✅ Client-side generation

## 🚀 Installation

```bash
npm install @gridkit/plugins
# or
yarn add @gridkit/plugins
# or
pnpm add @gridkit/plugins
```

## 🔌 Usage

```typescript
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter'
import { 
  auditLogPlugin, 
  analyticsPlugin, 
  exportPlugin 
} from '@gridkit/plugins'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    plugins: [
      auditLogPlugin({ ... }),
      analyticsPlugin({ ... }),
      exportPlugin({ ... })
    ]
  }
})
```

## 📖 Documentation

- [Plugin Development Guide](../../docs/plugins/development.md)
- [Plugin API Reference](../../docs/plugins/api.md)
- [Publishing Plugins](../../docs/plugins/publishing.md)

## 🤝 Contributing

We welcome plugin contributions! See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for details.

## 📄 License

MIT - see [LICENSE](../../../LICENSE) for details.
