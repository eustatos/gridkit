import { describe, it, expect, vi } from 'vitest';
import { PluginContext, Plugin } from '../core/Plugin';
import {
  initializePlugin,
  initializePlugins,
  PluginInitializationError,
} from '../lifecycle/Initializer';

describe('Initializer', () => {
  describe('initializePlugin', () => {
    it('should initialize a plugin successfully', async () => {
      const initializeMock = vi.fn();
      const plugin: Plugin = {
        metadata: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: initializeMock,
        destroy: vi.fn(),
      };

      const context: PluginContext = {
        eventBus: {} as any,
        config: { test: true },
        metadata: plugin.metadata,
      };

      await initializePlugin(plugin, context);

      expect(initializeMock).toHaveBeenCalledWith({ test: true }, context);
    });

    it('should handle async plugin initialization', async () => {
      const initializeMock = vi.fn().mockResolvedValue(undefined);
      const plugin: Plugin = {
        metadata: {
          id: 'async-plugin',
          name: 'Async Plugin',
          version: '1.0.0',
        },
        initialize: initializeMock,
        destroy: vi.fn(),
      };

      const context: PluginContext = {
        eventBus: {} as any,
        config: {},
        metadata: plugin.metadata,
      };

      await initializePlugin(plugin, context);

      expect(initializeMock).toHaveBeenCalledWith({}, context);
    });

    it('should throw PluginInitializationError on initialization failure', async () => {
      const plugin: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0',
        },
        initialize: () => {
          throw new Error('Initialization failed');
        },
        destroy: vi.fn(),
      };

      const context: PluginContext = {
        eventBus: {} as any,
        config: {},
        metadata: plugin.metadata,
      };

      await expect(initializePlugin(plugin, context)).rejects.toThrow(
        PluginInitializationError
      );
      await expect(initializePlugin(plugin, context)).rejects.toThrow(
        'Failed to initialize plugin failing-plugin: Initialization failed'
      );
    });
  });

  describe('initializePlugins', () => {
    it('should initialize multiple plugins successfully', async () => {
      const initializeMock1 = vi.fn();
      const initializeMock2 = vi.fn();

      const plugin1: Plugin = {
        metadata: {
          id: 'plugin-1',
          name: 'Plugin 1',
          version: '1.0.0',
        },
        initialize: initializeMock1,
        destroy: vi.fn(),
      };

      const plugin2: Plugin = {
        metadata: {
          id: 'plugin-2',
          name: 'Plugin 2',
          version: '1.0.0',
        },
        initialize: initializeMock2,
        destroy: vi.fn(),
      };

      const contexts = new Map<string, PluginContext>([
        [
          'plugin-1',
          {
            eventBus: {} as any,
            config: { id: 'plugin-1' },
            metadata: plugin1.metadata,
          },
        ],
        [
          'plugin-2',
          {
            eventBus: {} as any,
            config: { id: 'plugin-2' },
            metadata: plugin2.metadata,
          },
        ],
      ]);

      const results = await initializePlugins([plugin1, plugin2], contexts);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(initializeMock1).toHaveBeenCalledWith(
        { id: 'plugin-1' },
        contexts.get('plugin-1')
      );
      expect(initializeMock2).toHaveBeenCalledWith(
        { id: 'plugin-2' },
        contexts.get('plugin-2')
      );
    });

    it('should handle initialization failures with failFast=true in sequential mode', async () => {
      const plugin1: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0',
        },
        initialize: () => {
          throw new Error('Initialization failed');
        },
        destroy: vi.fn(),
      };

      const plugin2: Plugin = {
        metadata: {
          id: 'success-plugin',
          name: 'Success Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
        destroy: vi.fn(),
      };

      const contexts = new Map<string, PluginContext>([
        [
          'failing-plugin',
          {
            eventBus: {} as any,
            config: {},
            metadata: plugin1.metadata,
          },
        ],
        [
          'success-plugin',
          {
            eventBus: {} as any,
            config: {},
            metadata: plugin2.metadata,
          },
        ],
      ]);

      await expect(
        initializePlugins([plugin1, plugin2], contexts, {
          failFast: true,
          parallel: false,
        })
      ).rejects.toThrow(PluginInitializationError);
    });

    it('should collect all results with failFast=false', async () => {
      const plugin1: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0',
        },
        initialize: () => {
          throw new Error('Initialization failed');
        },
        destroy: vi.fn(),
      };

      const plugin2: Plugin = {
        metadata: {
          id: 'success-plugin',
          name: 'Success Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
        destroy: vi.fn(),
      };

      const contexts = new Map<string, PluginContext>([
        [
          'failing-plugin',
          {
            eventBus: {} as any,
            config: {},
            metadata: plugin1.metadata,
          },
        ],
        [
          'success-plugin',
          {
            eventBus: {} as any,
            config: {},
            metadata: plugin2.metadata,
          },
        ],
      ]);

      const results = await initializePlugins([plugin1, plugin2], contexts, {
        failFast: false,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
      expect(results[1].success).toBe(true);
    });
  });
});
