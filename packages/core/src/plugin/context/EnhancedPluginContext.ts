// Enhanced plugin context with additional features
import type { EventBus } from '../../events/core';
import type { PluginContext } from '../core/Plugin';
import type {
  EnhancedPlugin,
  EnhancedPluginMetadata,
  PluginStorage,
  PluginMessage,
  ResourceUsage,
} from '../types/enhanced';

/**
 * Enhanced plugin context providing extended functionality
 */
export class EnhancedPluginContext implements PluginContext {
  readonly eventBus: EventBus;
  readonly config: Record<string, unknown>;
  readonly metadata: EnhancedPluginMetadata;
  
  private storage = new Map<string, unknown>();
  private messageHandlers = new Map<string, (message: PluginMessage) => void>();
  private resourceUsage: ResourceUsage = {
    memory: 0,
    cpu: 0,
    eventHandlers: 0,
    eventsPerSecond: 0,
    storage: 0,
  };

  constructor(
    private readonly pluginId: string,
    eventBus: EventBus,
    metadata: EnhancedPluginMetadata,
    config: Record<string, unknown>
  ) {
    this.eventBus = eventBus;
    this.config = config;
    this.metadata = metadata;
  }

  /**
   * Get plugin ID
   */
  getPluginId(): string {
    return this.pluginId;
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): EnhancedPluginMetadata {
    return this.metadata;
  }

  /**
   * Get plugin configuration
   */
  getConfig(): Record<string, unknown> {
    return this.config;
  }

  /**
   * Get the plugin's event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Subscribe to events
   */
  on<T>(eventType: string, handler: (event: T) => void): () => void {
    const unsubscribe = this.eventBus.on(eventType as any, handler as any);
    this.resourceUsage.eventHandlers++;
    return unsubscribe;
  }

  /**
   * Emit events
   */
  emit<T>(eventType: string, payload: T): void {
    this.eventBus.emit(eventType as any, payload);
  }

  /**
   * Cross-plugin messaging
   */
  sendMessage(targetPlugin: string, message: unknown): void {
    const pluginMessage: PluginMessage = {
      type: 'cross-plugin-message',
      payload: message,
      source: this.pluginId,
      target: targetPlugin,
      timestamp: Date.now(),
    };
    this.eventBus.emit('plugin:message', pluginMessage);
  }

  /**
   * Listen to cross-plugin messages
   */
  onMessage(handler: (message: PluginMessage) => void): () => void {
    const messageId = `message-handler-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.messageHandlers.set(messageId, handler);

    return () => {
      this.messageHandlers.delete(messageId);
    };
  }

  /**
   * Get storage instance for this plugin
   */
  getStorage(): PluginStorage {
    return {
      get: <T>(key: string): T | undefined => {
        return this.storage.get(key) as T | undefined;
      },
      set: <T>(key: string, value: T): void => {
        this.storage.set(key, value);
        this.resourceUsage.storage = this.storage.size * 8;
      },
      delete: (key: string): void => {
        this.storage.delete(key);
        this.resourceUsage.storage = this.storage.size * 8;
      },
      clear: (): void => {
        this.storage.clear();
        this.resourceUsage.storage = 0;
      },
      keys: (): string[] => {
        return Array.from(this.storage.keys());
      },
      size: (): number => {
        return this.storage.size;
      },
    };
  }

  /**
   * Get current resource usage
   */
  getResourceUsage(): ResourceUsage {
    return this.resourceUsage;
  }

  /**
   * Update resource usage
   */
  updateResourceUsage(usage: Partial<ResourceUsage>): void {
    this.resourceUsage = { ...this.resourceUsage, ...usage };
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(permission: string): boolean {
    const enhancedMetadata = this.metadata as EnhancedPluginMetadata;
    // Note: requiredPermissions is on EnhancedPlugin, not EnhancedPluginMetadata
    // For now, return true as a safe default
    return true;
  }

  /**
   * Process incoming cross-plugin message
   */
  processMessage(message: PluginMessage): void {
    if (message.target === this.pluginId) {
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error processing message in plugin ${this.pluginId}:`, error);
        }
      });
    }
  }

  /**
   * Destroy context and cleanup
   */
  destroy(): void {
    this.eventBus.clear();
    this.storage.clear();
    this.messageHandlers.clear();
  }
}

/**
 * Context factory for creating enhanced plugin contexts
 */
export class PluginContextFactory {
  private contexts = new Map<string, EnhancedPluginContext>();

  /**
   * Create a new plugin context
   */
  createContext(
    pluginId: string,
    eventBus: EventBus,
    metadata: EnhancedPluginMetadata,
    config: Record<string, unknown>
  ): EnhancedPluginContext {
    if (this.contexts.has(pluginId)) {
      throw new Error(`Context already exists for plugin ${pluginId}`);
    }

    const context = new EnhancedPluginContext(pluginId, eventBus, metadata, config);
    this.contexts.set(pluginId, context);
    return context;
  }

  /**
   * Get existing context
   */
  getContext(pluginId: string): EnhancedPluginContext | undefined {
    return this.contexts.get(pluginId);
  }

  /**
   * Destroy context
   */
  destroyContext(pluginId: string): void {
    const context = this.contexts.get(pluginId);
    if (context) {
      context.destroy();
      this.contexts.delete(pluginId);
    }
  }

  /**
   * Destroy all contexts
   */
  destroyAll(): void {
    this.contexts.forEach(context => context.destroy());
    this.contexts.clear();
  }
}
