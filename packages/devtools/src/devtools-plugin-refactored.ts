/**
 * Refactored DevToolsPlugin with decomposed responsibilities
 *
 * This version uses separate services for different responsibilities:
 * 1. DevToolsConnector - Manages connection to DevTools
 * 2. StateSerializer - Serializes state
 * 3. ActionNamingSystem - Names actions
 * 4. MessageHandler - Handles DevTools messages
 * 5. StackTraceService - Captures stack traces
 * 6. AtomNameResolver - Resolves atom names
 * 7. PollingService - Fallback polling
 * 8. BatchUpdater - Batches updates
 * 9. ActionGrouper - Groups actions
 */

import type {
  DevToolsConfig,
  EnhancedStore,
  BasicAtom,
  DevToolsMode,
  ActionMetadata,
} from "./types";
import { atomRegistry } from "@nexus-state/core";

// Import decomposed services
import { DevToolsConnector, createDevToolsConnector } from "./devtools-connector";
import { StateSerializer, createStateSerializer } from "./state-serializer";
import { ActionNamingSystem, createActionNamingSystem } from "./action-naming";
import { MessageHandler, createMessageHandler } from "./message-handler";
import {
  StackTraceService,
  createStackTraceService,
} from "./stack-trace-service";
import { AtomNameResolver, createAtomNameResolver } from "./atom-name-resolver";
import { PollingService, createPollingService } from "./polling-service";
import { createBatchUpdater, type BatchUpdater } from "./batch-updater";
import { createActionGrouper, type ActionGrouper } from "./action-grouper";
import { createActionMetadata } from "./action-metadata";
import { createSnapshotMapper, type SnapshotMapper } from "./snapshot-mapper";

/**
 * Refactored DevToolsPlugin class with decomposed responsibilities
 */
export class DevToolsPluginRefactored {
  // Core services
  private connector: DevToolsConnector;
  private stateSerializer: StateSerializer;
  private actionNamingSystem: ActionNamingSystem;
  private messageHandler: MessageHandler;
  private stackTraceService: StackTraceService;
  private atomNameResolver: AtomNameResolver;
  private pollingService: PollingService;
  private batchUpdater: BatchUpdater;
  private actionGrouper: ActionGrouper;
  private snapshotMapper: SnapshotMapper;

  // Configuration
  private config: Required<DevToolsConfig>;

  // State
  private currentStore: EnhancedStore | null = null;
  private currentBatchId: string | null = null;
  private lastState: unknown = null;
  private lastLazyState: Record<string, unknown> | null = null;
  private isTracking = true;

  constructor(config: DevToolsConfig = {}) {
    // Store configuration
    this.config = this.createConfig(config);

    // Initialize services
    this.connector = createDevToolsConnector();
    this.stateSerializer = createStateSerializer();
    this.actionNamingSystem = this.createActionNamingSystem();
    this.messageHandler = createMessageHandler({
      enableTimeTravel: true,
      enableImportExport: true,
      debug: process.env.NODE_ENV !== "production",
    });
    this.stackTraceService = createStackTraceService();
    this.atomNameResolver = createAtomNameResolver({
      showAtomNames: this.config.showAtomNames,
      formatter: this.config.atomNameFormatter,
    });
    this.pollingService = createPollingService({
      interval: this.config.latency,
      debug: process.env.NODE_ENV !== "production",
    });
    this.snapshotMapper = createSnapshotMapper({
      maxMappings: this.config.maxAge,
      autoCleanup: true,
    });
    this.actionGrouper = createActionGrouper(this.config.actionGroupOptions);

    // Initialize batch updater
    const batchOpts = this.config.batchUpdate ?? {};
    this.batchUpdater = createBatchUpdater({
      batchLatencyMs: batchOpts.batchLatencyMs ?? this.config.latency,
      maxQueueSize: batchOpts.maxQueueSize ?? 100,
      throttleByFrame: batchOpts.throttleByFrame ?? true,
      maxUpdatesPerSecond: batchOpts.maxUpdatesPerSecond ?? 0,
      onFlush: (store, action) => {
        const targetStore = (store ??
          this.currentStore) as EnhancedStore | null;
        if (targetStore) {
          this.doSendStateUpdate(targetStore, action);
        }
      },
    });
  }

  /**
   * Create configuration with defaults
   */
  private createConfig(config: DevToolsConfig): Required<DevToolsConfig> {
    const {
      actionNamingStrategy = "auto",
      actionNamingPattern,
      actionNamingFunction,
      defaultNamingStrategy = "auto",
    } = config;

    return {
      name: config.name ?? "nexus-state",
      trace: config.trace ?? false,
      traceLimit: config.traceLimit ?? 10,
      latency: config.latency ?? 100,
      maxAge: config.maxAge ?? 50,
      actionSanitizer: config.actionSanitizer ?? (() => true),
      stateSanitizer: config.stateSanitizer ?? ((state) => state),
      showAtomNames: config.showAtomNames ?? true,
      atomNameFormatter:
        config.atomNameFormatter ??
        ((atom: BasicAtom, defaultName: string) => defaultName),
      actionNamingStrategy,
      actionNamingPattern,
      actionNamingFunction,
      defaultNamingStrategy,
      serialization: config.serialization,
      batchUpdate: config.batchUpdate,
      actionGroupOptions: config.actionGroupOptions,
    } as Required<DevToolsConfig>;
  }

  /**
   * Create action naming system based on config
   */
  private createActionNamingSystem(): ActionNamingSystem {
    const {
      actionNamingStrategy,
      actionNamingPattern,
      actionNamingFunction,
      defaultNamingStrategy,
    } = this.config;

    // If strategy is already an instance, use it directly
    if (
      typeof actionNamingStrategy === "object" &&
      "getName" in actionNamingStrategy
    ) {
      const system = new ActionNamingSystem();
      system.getRegistry().register(actionNamingStrategy as any, true);
      return system;
    }

    // Handle string strategy types
    const strategyType = actionNamingStrategy as string;

    // Build options based on config
    const options: any = {
      defaultStrategy: defaultNamingStrategy,
    };

    if (strategyType === "pattern" && actionNamingPattern) {
      options.strategy = "pattern";
      options.patternConfig = {
        pattern: actionNamingPattern,
        placeholders: {
          atomName: true,
          operation: true,
          timestamp: true,
          date: false,
          time: false,
        },
      };
    } else if (strategyType === "custom" && actionNamingFunction) {
      options.strategy = "custom";
      options.customConfig = {
        namingFunction: actionNamingFunction,
      };
    } else {
      options.strategy = strategyType;
    }

    return createActionNamingSystem(options);
  }

  /**
   * Apply the plugin to a store
   */
  apply(store: EnhancedStore): void {
    console.log('[DevToolsPlugin.apply] Store received:', {
      hasTimeTravel: 'timeTravel' in store,
      timeTravelType: typeof (store as any).timeTravel,
      storeKeys: Object.keys(store).filter(k => !k.startsWith('get') && k !== 'set' && k !== 'subscribe'),
    });
    
    this.currentStore = store;

    // Runtime production guard
    if (process.env.NODE_ENV === "production") {
      return;
    }

    // Connect to DevTools
    const connection = this.connector.connect({
      name: this.config.name,
      trace: this.config.trace,
      latency: this.config.latency,
      maxAge: this.config.maxAge,
    });

    if (!connection) {
      return;
    }

    // Send initial state
    this.sendInitialState(store);

    // Setup message handler
    this.messageHandler.setStore(store);
    this.messageHandler.setSnapshotMapper(this.snapshotMapper);

    // Subscribe to DevTools messages
    this.connector.subscribe((message) => {
      this.messageHandler.handle(message, store);
    });

    // Enhance store methods if available
    if (store.setWithMetadata) {
      this.enhanceStoreWithMetadata(store);
    } else {
      // Fallback to polling for basic stores
      this.setupPolling(store);
    }
  }

  /**
   * Send initial state to DevTools
   */
  private sendInitialState(store: EnhancedStore): void {
    try {
      const state = store.serializeState?.() || store.getState();
      const sanitized = this.config.stateSanitizer(state) as Record<
        string,
        unknown
      >;
      this.lastState = sanitized;

      const lazyOpts = this.getLazySerializationOptions();
      let stateToSend: unknown = sanitized;

      if (lazyOpts) {
        const result = this.stateSerializer.serializeLazy(sanitized, lazyOpts);
        this.lastLazyState = result.state as Record<string, unknown>;
        stateToSend = result.state;
      } else {
        this.lastLazyState = null;
      }

      this.connector.init(stateToSend);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to send initial state to DevTools:", error);
      }
    }
  }

  /**
   * Get lazy serialization options from config
   */
  private getLazySerializationOptions(): any {
    const ser = this.config.serialization;
    if (!ser?.lazy) return null;

    return {
      maxDepth: ser.maxDepth,
      maxSerializedSize: ser.maxSerializedSize,
      circularRefHandling: ser.circularRefHandling,
      placeholder: ser.placeholder,
    };
  }

  /**
   * Enhance store with metadata support
   */
  private enhanceStoreWithMetadata(store: EnhancedStore): void {
    if (!store.setWithMetadata) return;

    // Override set method to capture metadata
    store.set = ((atom: BasicAtom, update: unknown) => {
      const atomName = this.atomNameResolver.getName(atom);
      const actionName = this.actionNamingSystem.getName({
        atom,
        atomName,
        operation: "SET",
      });

      const builder = createActionMetadata()
        .type(actionName)
        .timestamp(Date.now())
        .source("DevToolsPlugin")
        .atomName(atomName);

      if (this.currentBatchId) {
        builder.groupId(this.currentBatchId);
      }

      if (this.config.trace) {
        const captured = this.stackTraceService.capture({
          limit: this.config.traceLimit,
        });
        if (captured) {
          builder.stackTrace(
            this.stackTraceService.formatForDevTools(captured),
          );
        }
      }

      const metadata = builder.build() as ActionMetadata;

      store.setWithMetadata?.(atom, update, metadata);

      if (this.currentBatchId) {
        this.actionGrouper.add(metadata);
      } else {
        this.sendStateUpdate(store, metadata.type);
      }
    }) as unknown as typeof store.set;
  }

  /**
   * Setup polling for state updates (fallback for basic stores)
   */
  private setupPolling(store: EnhancedStore): void {
    this.pollingService.start(this.config.latency, () => {
      if (this.isTracking) {
        const actionName = this.actionNamingSystem.getName({
          atom: { id: { toString: () => "polling" } } as BasicAtom,
          atomName: "polling",
          operation: "STATE_UPDATE",
        });
        this.sendStateUpdate(store, actionName);
      }
    });
  }

  /**
   * Send state update to DevTools
   */
  private doSendStateUpdate(store: EnhancedStore, action: string): void {
    if (!this.isTracking || !this.connector.isConnectedToDevTools()) return;

    try {
      const currentState = store.serializeState?.() || store.getState();
      const sanitizedState = this.config.stateSanitizer(currentState) as Record<
        string,
        unknown
      >;

      const lazyOpts = this.getLazySerializationOptions();
      let stateToSend: unknown = sanitizedState;
      let stateChanged: boolean;

      if (lazyOpts) {
        const prevState = this.lastState as Record<string, unknown> | null;
        const changedKeys = this.stateSerializer.getChangedKeys(
          prevState,
          sanitizedState,
        );
        const result = this.stateSerializer.serializeLazy(
          sanitizedState,
          lazyOpts,
          this.lastLazyState ?? undefined,
          changedKeys.size > 0 ? changedKeys : undefined,
        );
        stateToSend = result.state;
        const prevLazy = this.lastLazyState;
        this.lastLazyState = result.state as Record<string, unknown>;
        this.lastState = sanitizedState;
        stateChanged =
          prevLazy === null ||
          JSON.stringify(result.state) !== JSON.stringify(prevLazy);
      } else {
        stateChanged =
          JSON.stringify(sanitizedState) !== JSON.stringify(this.lastState);
        if (stateChanged) {
          this.lastState = sanitizedState;
        }
      }

      if (stateChanged && this.config.actionSanitizer(action, stateToSend)) {
        this.connector.send(action, stateToSend);
        this.snapshotMapper.mapSnapshotToAction(
          `snap-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          action,
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to send state update to DevTools:", error);
      }
    }
  }

  /**
   * Schedule a state update to be sent to DevTools
   */
  private sendStateUpdate(store: EnhancedStore, action: string): void {
    this.batchUpdater.schedule(store, action);
  }

  /**
   * Start a batch for grouping actions
   */
  startBatch(groupId: string): void {
    this.currentBatchId = groupId;
    this.actionGrouper.startGroup(groupId);
  }

  /**
   * End a batch and send grouped action
   */
  endBatch(groupId: string): void {
    if (this.currentBatchId === groupId) {
      this.currentBatchId = null;
    }
    const result = this.actionGrouper.endGroup(groupId);
    if (result && this.currentStore) {
      this.sendStateUpdate(this.currentStore, result.type);
    }
  }

  /**
   * Export current state in DevTools-compatible format
   */
  exportState(
    store: EnhancedStore,
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> {
    try {
      const state = store.serializeState?.() || store.getState();
      const lazyOpts = this.getLazySerializationOptions();

      const exported = lazyOpts
        ? this.stateSerializer.exportStateLazy(
            state as Record<string, unknown>,
            lazyOpts,
            metadata,
          )
        : this.stateSerializer.exportState(
            state as Record<string, unknown>,
            metadata,
          );

      return {
        state: exported.state,
        timestamp: exported.timestamp,
        checksum: exported.checksum,
        version: exported.version,
        metadata: exported.metadata,
      };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to export state:", error);
      }

      const state = store.serializeState?.() || store.getState();
      return {
        state,
        timestamp: Date.now(),
        checksum: "",
        version: "1.0.0",
        metadata: metadata || {},
      };
    }
  }

  /**
   * Get the snapshot mapper
   */
  getSnapshotMapper(): SnapshotMapper {
    return this.snapshotMapper;
  }

  /**
   * Get the message handler
   */
  getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }

  /**
   * Get the atom name resolver
   */
  getAtomNameResolver(): AtomNameResolver {
    return this.atomNameResolver;
  }

  /**
   * Get the stack trace service
   */
  getStackTraceService(): StackTraceService {
    return this.stackTraceService;
  }

  /**
   * Get the polling service
   */
  getPollingService(): PollingService {
    return this.pollingService;
  }

  /**
   * Get the DevTools connector (for testing purposes)
   */
  getConnector(): DevToolsConnector {
    return this.connector;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.connector.disconnect();
    this.pollingService.dispose();
    this.currentStore = null;
    this.currentBatchId = null;
    this.lastState = null;
    this.lastLazyState = null;
    this.isTracking = false;
  }
}

/**
 * Create a new refactored DevToolsPlugin instance
 */
export function createDevToolsPluginRefactored(
  config: DevToolsConfig = {},
): DevToolsPluginRefactored {
  return new DevToolsPluginRefactored(config);
}
