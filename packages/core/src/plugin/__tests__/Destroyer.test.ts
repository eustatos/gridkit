import { describe, it, expect, vi } from 'vitest';
import {
  destroyPlugin,
  destroyPlugins,
  PluginDestructionError
} from '../lifecycle/Destroyer';
import type { Plugin, PluginContext } from '../core/Plugin';

describe('Destroyer', () => {
  describe('destroyPlugin', () => {
    it('should destroy a plugin successfully', async () => {
      const destroyMock = vi.fn();
      const plugin: Plugin = {
        metadata: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: destroyMock
      };
      
      const context: PluginContext = {
        eventBus: {} as any,
        config: {},
        metadata: plugin.metadata
      };
      
      await destroyPlugin(plugin, context);
      
      expect(destroyMock).toHaveBeenCalled();
    });
    
    it('should handle async plugin destruction', async () => {
      const destroyMock = vi.fn().mockResolvedValue(undefined);
      const plugin: Plugin = {
        metadata: {
          id: 'async-plugin',
          name: 'Async Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: destroyMock
      };
      
      const context: PluginContext = {
        eventBus: {} as any,
        config: {},
        metadata: plugin.metadata
      };
      
      await destroyPlugin(plugin, context);
      
      expect(destroyMock).toHaveBeenCalled();
    });
    
    it('should throw PluginDestructionError on destruction failure', async () => {
      const plugin: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: () => {
          throw new Error('Destruction failed');
        }
      };
      
      const context: PluginContext = {
        eventBus: {} as any,
        config: {},
        metadata: plugin.metadata
      };
      
      await expect(destroyPlugin(plugin, context)).rejects.toThrow(PluginDestructionError);
      await expect(destroyPlugin(plugin, context)).rejects.toThrow('Failed to destroy plugin failing-plugin: Destruction failed');
    });
  });
  
  describe('destroyPlugins', () => {
    it('should destroy multiple plugins successfully', async () => {
      const destroyMock1 = vi.fn();
      const destroyMock2 = vi.fn();
      
      const plugin1: Plugin = {
        metadata: {
          id: 'plugin-1',
          name: 'Plugin 1',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: destroyMock1
      };
      
      const plugin2: Plugin = {
        metadata: {
          id: 'plugin-2',
          name: 'Plugin 2',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: destroyMock2
      };
      
      const contexts = new Map<string, PluginContext>([
        ['plugin-1', {
          eventBus: {} as any,
          config: {},
          metadata: plugin1.metadata
        }],
        ['plugin-2', {
          eventBus: {} as any,
          config: {},
          metadata: plugin2.metadata
        }]
      ]);
      
      const results = await destroyPlugins([plugin1, plugin2], contexts);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(destroyMock1).toHaveBeenCalled();
      expect(destroyMock2).toHaveBeenCalled();
    });
    
    it('should handle destruction failures with failFast=true', async () => {
      const plugin1: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: () => {
          throw new Error('Destruction failed');
        }
      };
      
      const plugin2: Plugin = {
        metadata: {
          id: 'success-plugin',
          name: 'Success Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: vi.fn()
      };
      
      const contexts = new Map<string, PluginContext>([
        ['failing-plugin', {
          eventBus: {} as any,
          config: {},
          metadata: plugin1.metadata
        }],
        ['success-plugin', {
          eventBus: {} as any,
          config: {},
          metadata: plugin2.metadata
        }]
      ]);
      
      await expect(destroyPlugins([plugin1, plugin2], contexts, { failFast: true }))
        .rejects.toThrow(PluginDestructionError);
    });
    
    it('should collect all results with failFast=false', async () => {
      const plugin1: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: () => {
          throw new Error('Destruction failed');
        }
      };
      
      const plugin2: Plugin = {
        metadata: {
          id: 'success-plugin',
          name: 'Success Plugin',
          version: '1.0.0'
        },
        initialize: vi.fn(),
        destroy: vi.fn()
      };
      
      const contexts = new Map<string, PluginContext>([
        ['failing-plugin', {
          eventBus: {} as any,
          config: {},
          metadata: plugin1.metadata
        }],
        ['success-plugin', {
          eventBus: {} as any,
          config: {},
          metadata: plugin2.metadata
        }]
      ]);
      
      const results = await destroyPlugins([plugin1, plugin2], contexts, { failFast: false });
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
      expect(results[1].success).toBe(true);
    });
  });
});