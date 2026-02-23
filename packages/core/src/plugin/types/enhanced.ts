// Enhanced plugin interface with marketplace and hot-reload support
import type { Plugin, PluginMetadata } from '../core/Plugin';

export interface EnhancedPlugin<TConfig = PluginConfig> extends Plugin<TConfig> {
  // Enhanced metadata
  metadata: EnhancedPluginMetadata;

  // Configuration validation
  validateConfig?(config: TConfig): ValidationResult;

  // Default configuration
  getDefaultConfig?(): TConfig;

  // Hot reload support
  onHotReload?(): Promise<void>;

  // Health check
  healthCheck?(): Promise<PluginHealth>;

  // Required permissions
  requiredPermissions?: Permission[];

  // Resource limits
  resourceLimits?: ResourceLimits;
}

/**
 * Enhanced plugin metadata with marketplace capabilities
 */
export interface EnhancedPluginMetadata extends PluginMetadata {
  // Author information
  author: string;

  // Categorization
  category: PluginCategory;
  tags: string[];

  // Compatibility
  coreVersion: string;
  peerPlugins?: string[];
  incompatibleWith?: string[];

  // Marketplace
  homepage?: string;
  repository?: string;
  license: string;
  pricing?: PluginPricing;

  // Quality indicators
  verified: boolean;
  featured: boolean;
  downloads?: number;
  rating?: number;
}

/**
 * Plugin categories for marketplace organization
 */
export type PluginCategory =
  | 'data'
  | 'ui'
  | 'export'
  | 'analytics'
  | 'collaboration'
  | 'security'
  | 'utility'
  | 'integration'
  | 'development';

/**
 * Plugin pricing models
 */
export type PluginPricing = 'free' | 'freemium' | 'paid' | 'community';

/**
 * Resource limits for plugin sandboxing
 */
export interface ResourceLimits {
  /** Maximum memory usage in MB */
  maxMemoryMB?: number;

  /** Maximum CPU percentage */
  maxCPUPercent?: number;

  /** Maximum number of event handlers */
  maxEventHandlers?: number;

  /** Maximum storage in MB */
  maxStorageMB?: number;

  /** Maximum events per second */
  maxEventsPerSecond?: number;
}

/**
 * Permission descriptor for plugin isolation
 */
export interface Permission {
  /** Permission name */
  name: string;

  /** Permission description */
  description?: string;

  /** Required capabilities */
  capabilities?: string[];
}

/**
 * Plugin health status
 */
export interface PluginHealth {
  /** Health status */
  status: 'healthy' | 'warning' | 'error' | 'unknown';

  /** Health check timestamp */
  timestamp: number;

  /** Health check duration in ms */
  duration?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Plugin configuration validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Validation errors if any */
  errors?: string[];

  /** Validation warnings */
  warnings?: string[];
}

/**
 * Plugin resource usage
 */
export interface ResourceUsage {
  /** Memory usage in bytes */
  memory: number;

  /** CPU usage percentage */
  cpu: number;

  /** Number of active event handlers */
  eventHandlers: number;

  /** Number of events emitted per second */
  eventsPerSecond: number;

  /** Storage usage in bytes */
  storage: number;
}

/**
 * Plugin update information
 */
export interface PluginUpdate {
  /** Plugin ID */
  pluginId: string;

  /** Current version */
  currentVersion: string;

  /** Available version */
  availableVersion: string;

  /** Update type */
  type: 'major' | 'minor' | 'patch';

  /** Release notes */
  releaseNotes?: string;
}

/**
 * Plugin marketplace search query
 */
export interface PluginSearchQuery {
  /** Search query */
  query?: string;

  /** Filter by category */
  category?: PluginCategory;

  /** Filter by tags */
  tags?: string[];

  /** Filter by verification status */
  verified?: boolean;

  /** Filter by pricing */
  pricing?: PluginPricing;

  /** Minimum rating filter */
  minRating?: number;

  /** Sort by */
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name';

  /** Sort order */
  sortOrder?: 'asc' | 'desc';

  /** Page limit */
  limit?: number;

  /** Page offset */
  offset?: number;
}

/**
 * Plugin marketplace search result
 */
export interface PluginSearchResult {
  /** Search results */
  plugins: EnhancedPluginMetadata[];

  /** Total count */
  total: number;

  /** Current page */
  page: number;

  /** Page size */
  pageSize: number;

  /** Filter applied */
  filters: Record<string, unknown>;
}

/**
 * Plugin analytics data
 */
export interface PluginAnalytics {
  /** Total downloads */
  downloads: number;

  /** Active users */
  activeUsers: number;

  /** Average rating */
  rating: number;

  /** Usage statistics */
  usageStats: Record<string, number>;

  /** Error rate */
  errorRate: number;
}

/**
 * Plugin storage interface for isolated data
 */
export interface PluginStorage {
  /** Get value from storage */
  get<T>(key: string): T | undefined;

  /** Set value in storage */
  set<T>(key: string, value: T): void;

  /** Delete value from storage */
  delete(key: string): void;

  /** Clear all storage */
  clear(): void;

  /** Get all keys */
  keys(): string[];

  /** Get storage size */
  size(): number;
}

/**
 * Cross-plugin message interface
 */
export interface PluginMessage {
  /** Message type */
  type: string;

  /** Message payload */
  payload: unknown;

  /** Source plugin ID */
  source?: string;

  /** Target plugin ID */
  target?: string;

  /** Timestamp */
  timestamp: number;
}

/**
 * Plugin marketplace configuration
 */
export interface MarketplaceConfig {
  /** Marketplace API URL */
  apiUrl?: string;

  /** Local plugin directory */
  pluginDir?: string;

  /** Enable caching */
  cacheEnabled?: boolean;

  /** Cache TTL in ms */
  cacheTTL?: number;
}

/**
 * Publish metadata for plugin marketplace
 */
export interface PublishMetadata {
  /** Version to publish */
  version: string;

  /** Release notes */
  releaseNotes?: string;

  /** Files to publish */
  files?: string[];

  /** Tags to add */
  tags?: string[];
}

/**
 * Hot reload configuration
 */
export interface HotReloadConfig {
  /** Enable hot reload */
  enabled?: boolean;

  /** Watch path */
  watchPath?: string;

  /** Debounce delay in ms */
  debounceDelay?: number;
}

/**
 * Plugin error type for plugin-specific errors
 */
export class PluginError extends Error {
  constructor(
    message: string,
    public readonly pluginId: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

/**
 * Plugin not found error
 */
export class PluginNotFoundError extends PluginError {
  constructor(pluginId: string) {
    super(`Plugin ${pluginId} not found`, pluginId, 'PLUGIN_NOT_FOUND');
    this.name = 'PluginNotFoundError';
  }
}

/**
 * Plugin validation error
 */
export class PluginValidationError extends PluginError {
  constructor(
    pluginId: string,
    public readonly validationErrors: string[]
  ) {
    super(`Plugin ${pluginId} validation failed: ${validationErrors.join(', ')}`, pluginId, 'VALIDATION_FAILED');
    this.name = 'PluginValidationError';
  }
}

/**
 * Plugin dependency error
 */
export class PluginDependencyError extends PluginError {
  constructor(
    pluginId: string,
    public readonly missingDependencies: string[]
  ) {
    super(`Plugin ${pluginId} missing dependencies: ${missingDependencies.join(', ')}`, pluginId, 'DEPENDENCY_MISSING');
    this.name = 'PluginDependencyError';
  }
}

/**
 * Plugin health check error
 */
export class PluginHealthCheckError extends PluginError {
  constructor(
    pluginId: string,
    public readonly health: PluginHealth
  ) {
    super(`Plugin ${pluginId} health check failed`, pluginId, 'HEALTH_CHECK_FAILED');
    this.name = 'PluginHealthCheckError';
  }
}

/**
 * Plugin marketplace error
 */
export class PluginMarketplaceError extends PluginError {
  constructor(
    message: string,
    pluginId: string,
    public readonly httpStatus?: number
  ) {
    super(message, pluginId, 'MARKETPLACE_ERROR');
    this.name = 'PluginMarketplaceError';
  }
}

/**
 * Hot reload error
 */
export class HotReloadError extends PluginError {
  cause?: Error;

  constructor(
    pluginId: string,
    cause?: Error
  ) {
    super(`Hot reload failed for plugin ${pluginId}: ${cause?.message}`, pluginId, 'HOT_RELOAD_FAILED');
    this.name = 'HotReloadError';
    this.cause = cause;
  }
}
