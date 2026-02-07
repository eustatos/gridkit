import { EventSandbox } from './isolation/EventSandbox';
import { PermissionManager } from './isolation/PermissionManager';
import { QuotaManager } from './isolation/QuotaManager';
import { EventValidator } from './security/EventValidator';
import { ErrorBoundary } from './security/ErrorBoundary';
import { ResourceMonitor } from './security/ResourceMonitor';
import { PluginEventForwarder } from './events/PluginEventForwarder';
import { CrossPluginBridge } from './events/CrossPluginBridge';
import type { EventBus } from './events/PluginEventBus';
import type { GridEvent } from './events/PluginEvents';

/**
 * SandboxedPluginManager orchestrates the plugin isolation system,
 * managing event sandboxes, permissions, quotas, and security features.
 */
export class SandboxedPluginManager {
  private sandboxes = new Map<string, EventSandbox>();
  private permissionManager = new PermissionManager();
  private quotaManager = new QuotaManager();
  private eventValidator = new EventValidator();
  private resourceMonitor = new ResourceMonitor();
  private crossPluginBridge = new CrossPluginBridge();
  private errorBoundaries = new Map<string, ErrorBoundary>();
  private baseEventBus: EventBus;

  /**
   * Creates a new sandboxed plugin manager.
   * @param baseEventBus - The base event bus for the system
   */
  constructor(baseEventBus: EventBus) {
    this.baseEventBus = baseEventBus;
    this.resourceMonitor.startMonitoring();
  }

  /**
   * Creates a new plugin sandbox.
   * @param pluginId - The plugin identifier
   * @param permissions - The permissions granted to the plugin
   * @returns The created event sandbox
   */
  public createSandbox(pluginId: string, permissions: string[]): EventSandbox {
    // Check if sandbox already exists
    if (this.sandboxes.has(pluginId)) {
      throw new Error(`Sandbox already exists for plugin ${pluginId}`);
    }

    // Create the sandbox
    const sandbox = new EventSandbox(pluginId, this.baseEventBus, permissions);
    this.sandboxes.set(pluginId, sandbox);

    // Register with cross-plugin bridge
    this.crossPluginBridge.registerPlugin(pluginId, sandbox.getLocalBus());

    // Set up error boundary
    const errorBoundary = new ErrorBoundary(pluginId, (error) => {
      console.error(`Plugin ${pluginId} error:`, error);
      // Could notify monitoring systems or take other actions
    });
    this.errorBoundaries.set(pluginId, errorBoundary);

    // Grant permissions
    this.permissionManager.grantCapabilities(pluginId, permissions);

    return sandbox;
  }

  /**
   * Destroys a plugin sandbox and cleans up resources.
   * @param pluginId - The plugin identifier
   */
  public destroySandbox(pluginId: string): void {
    const sandbox = this.sandboxes.get(pluginId);
    if (sandbox) {
      sandbox.destroy();
      this.sandboxes.delete(pluginId);
    }

    // Clean up other resources
    this.permissionManager.clearPermissions(pluginId);
    this.quotaManager.resetUsage(pluginId);
    this.crossPluginBridge.unregisterPlugin(pluginId);
    this.errorBoundaries.delete(pluginId);
  }

  /**
   * Validates an event payload.
   * @param event - The event to validate
   * @returns Validation result
   */
  public validateEvent(event: GridEvent): { isValid: boolean; errorMessage?: string } {
    const result = this.eventValidator.validateEvent(event);
    
    if (!result.isValid) {
      return {
        isValid: false,
        errorMessage: result.errorMessage,
      };
    }
    
    return { isValid: true };
  }

  /**
   * Sanitizes an event payload.
   * @param event - The event to sanitize
   * @returns Sanitized event or null if the event should be rejected
   */
  public sanitizeEvent(event: GridEvent): GridEvent | null {
    return this.eventValidator.sanitizeEvent(event);
  }

  /**
   * Checks if a plugin has permission to perform an action.
   * @param pluginId - The plugin identifier
   * @param permission - The permission to check
   * @returns true if the plugin has the permission, false otherwise
   */
  public hasPermission(pluginId: string, permission: string): boolean {
    return this.permissionManager.hasPermission(pluginId, permission);
  }

  /**
   * Checks if a plugin is within its resource quota.
   * @param pluginId - The plugin identifier
   * @param resource - The resource to check
   * @param amount - The amount of resource being requested
   * @returns true if the plugin is within quota, false otherwise
   */
  public checkQuota(pluginId: string, resource: string, amount: number): boolean {
    return this.quotaManager.checkQuota(pluginId, resource, amount);
  }

  /**
   * Approves a cross-plugin communication channel.
   * @param sourcePluginId - The source plugin identifier
   * @param targetPluginId - The target plugin identifier
   * @param eventTypes - The event types allowed on this channel
   */
  public approveCrossPluginChannel(
    sourcePluginId: string,
    targetPluginId: string,
    eventTypes: string[]
  ): void {
    this.crossPluginBridge.approveChannel(sourcePluginId, targetPluginId, eventTypes);
  }

  /**
   * Wraps a function with error boundary protection.
   * @param pluginId - The plugin identifier
   * @param fn - The function to wrap
   * @param context - Optional context description for error messages
   * @returns A wrapped function that catches and handles errors
   */
  public wrapWithBoundary<T extends (...args: any[]) => any>(
    pluginId: string,
    fn: T,
    context?: string
  ): T {
    const errorBoundary = this.errorBoundaries.get(pluginId);
    if (errorBoundary) {
      return errorBoundary.wrap(fn, context);
    }
    return fn;
  }

  /**
   * Records resource usage for a plugin.
   * @param pluginId - The plugin identifier
   * @param resource - The resource type
   * @param amount - The amount of resource used
   */
  public recordResourceUsage(pluginId: string, resource: string, amount: number): void {
    // Record with resource monitor
    if (resource === 'events') {
      this.resourceMonitor.recordEventEmission(pluginId, amount);
    } else if (resource === 'executionTime') {
      this.resourceMonitor.recordHandlerExecution(pluginId, amount);
    }
  }

  /**
   * Gets current resource usage for a plugin.
   * @param pluginId - The plugin identifier
   * @returns Current resource usage
   */
  public getResourceUsage(pluginId: string): any {
    return this.resourceMonitor.getUsage(pluginId);
  }

  /**
   * Checks if a plugin is exceeding resource limits.
   * @param pluginId - The plugin identifier
   * @returns true if the plugin is exceeding limits, false otherwise
   */
  public isExceedingLimits(pluginId: string): boolean {
    return this.resourceMonitor.isExceedingLimits(pluginId);
  }

  /**
   * Gets the base event bus.
   * @returns The base event bus
   */
  public getBaseEventBus(): EventBus {
    return this.baseEventBus;
  }

  /**
   * Cleans up all resources when the manager is destroyed.
   */
  public destroy(): void {
    // Destroy all sandboxes
    for (const [pluginId] of this.sandboxes) {
      this.destroySandbox(pluginId);
    }

    // Stop resource monitoring
    this.resourceMonitor.stopMonitoring();

    // Clear all collections
    this.sandboxes.clear();
    this.errorBoundaries.clear();
  }
}