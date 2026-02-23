/**
 * GridKit Column Enhancers for TanStack Table
 *
 * Column-level enhancements that extend TanStack Table's column definitions
 * with GridKit features like validation, formatting, events, and metadata.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

// Core enhancers
export { enhanceColumn } from './enhanceColumn'

// Validation
export { withColumnValidation } from './withColumnValidation'

// Formatting
export { withColumnFormat, formatters } from './withColumnFormat'

// Events
export { withColumnEvents } from './withColumnEvents'

// Metadata
export { withColumnMetadata } from './withColumnMetadata'

// Performance
export { withColumnPerformance } from './withColumnPerformance'

// Composition
export { composeColumnEnhancers, createEnhancedColumn } from './composeColumnEnhancers'

// Types
export type {
  EnhancedColumnDef,
  ColumnEnhancementOptions,
} from './enhanceColumn'

export type { ValidatedColumnDef, ColumnValidationOptions } from './withColumnValidation'

export type { FormattedColumnDef, ColumnFormatter } from './withColumnFormat'

export type { EventfulColumnDef, ColumnEventHandlers } from './withColumnEvents'

export type { MetadataColumnDef, ColumnMetadata } from './withColumnMetadata'

export type { PerformantColumnDef, ColumnPerformanceOptions } from './withColumnPerformance'

export type { ColumnEnhancer } from './composeColumnEnhancers'
