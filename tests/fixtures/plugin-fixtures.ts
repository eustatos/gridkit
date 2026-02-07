import { createEventBus } from '../../packages/core/src/events/PluginEventBus';
import { SandboxedPluginManager } from '../../packages/core/src/plugin/SandboxedPluginManager';

/**
 * Creates a test plugin manager with predefined plugins and permissions.
 * @returns A configured SandboxedPluginManager for testing
 */
export function createTestPluginManager() {
  // Create a base event bus for the system
  const baseEventBus = createEventBus();
  
  // Create the plugin manager
  const pluginManager = new SandboxedPluginManager(baseEventBus);
  
  // Create test plugins with different permissions
  pluginManager.createSandbox('plugin-a', [
    'read:data',
    'emit:events',
    'receive:plugin-b-event'
  ]);
  
  pluginManager.createSandbox('plugin-b', [
    'write:config',
    'emit:events',
    'receive:plugin-a-event'
  ]);
  
  pluginManager.createSandbox('plugin-c', [
    'read:data',
    'write:config'
    // No event permissions
  ]);
  
  // Set up quotas for plugins
  pluginManager.checkQuota('plugin-a', 'maxEventsPerSecond', 100);
  pluginManager.checkQuota('plugin-b', 'maxEventsPerSecond', 50);
  
  // Approve cross-plugin communication
  pluginManager.approveCrossPluginChannel('plugin-a', 'plugin-b', ['data-request', 'data-response']);
  pluginManager.approveCrossPluginChannel('plugin-b', 'plugin-a', ['data-response']);
  
  return pluginManager;
}

/**
 * Creates a test event with common properties.
 * @param type - The event type
 * @param payload - The event payload
 * @param source - Optional event source
 * @returns A GridEvent object for testing
 */
export function createTestEvent(type: string, payload: any, source?: string) {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source,
    metadata: {
      test: true
    }
  };
}

/**
 * Mock plugin data for testing.
 */
export const mockPluginData = {
  pluginA: {
    id: 'plugin-a',
    name: 'Test Plugin A',
    permissions: ['read:data', 'emit:events'],
    config: {
      enabled: true,
      debug: false
    }
  },
  
  pluginB: {
    id: 'plugin-b',
    name: 'Test Plugin B',
    permissions: ['write:config', 'emit:events'],
    config: {
      enabled: true,
      debug: true
    }
  },
  
  pluginC: {
    id: 'plugin-c',
    name: 'Test Plugin C',
    permissions: ['read:data', 'write:config'],
    config: {
      enabled: false,
      debug: false
    }
  }
};

/**
 * Test events for plugin communication.
 */
export const testEvents = {
  dataRequest: {
    type: 'data-request',
    payload: {
      requestId: 'req-123',
      dataType: 'user-data'
    }
  },
  
  dataResponse: {
    type: 'data-response',
    payload: {
      requestId: 'req-123',
      data: [{ id: 1, name: 'Test User' }]
    }
  },
  
  configUpdate: {
    type: 'config-update',
    payload: {
      key: 'theme',
      value: 'dark'
    }
  },
  
  errorEvent: {
    type: 'plugin-error',
    payload: {
      message: 'Test error',
      code: 'TEST_ERROR'
    }
  }
};

/**
 * Test permissions for different plugin scenarios.
 */
export const testPermissions = {
  readData: 'read:data',
  writeConfig: 'write:config',
  emitEvents: 'emit:events',
  receiveEvents: 'receive:events',
  all: '*'
};

/**
 * Test quotas for resource limiting.
 */
export const testQuotas = {
  pluginA: {
    maxEventsPerSecond: 100,
    maxHandlerTimePerSecond: 50,
    maxMemoryUsage: 1024 * 1024 // 1MB
  },
  
  pluginB: {
    maxEventsPerSecond: 50,
    maxHandlerTimePerSecond: 100,
    maxMemoryUsage: 2 * 1024 * 1024 // 2MB
  },
  
  pluginC: {
    maxEventsPerSecond: 10,
    maxHandlerTimePerSecond: 200,
    maxMemoryUsage: 512 * 1024 // 512KB
  }
};