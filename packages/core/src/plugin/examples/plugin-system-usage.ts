/**
 * Plugin System Usage Examples
 * 
 * This file demonstrates how to use the GridKit Plugin System
 * in various scenarios.
 */

import {
  PluginManager,
  type Plugin,
  type PluginContext
} from '../index';

// Example 1: Basic Plugin Implementation
class BasicPlugin implements Plugin<{ enabled: boolean }> {
  public readonly metadata = {
    id: 'basic-plugin',
    name: 'Basic Plugin',
    version: '1.0.0',
    description: 'A simple example plugin'
  };

  private isEnabled = false;
  private context: PluginContext | null = null;

  async initialize(config: { enabled: boolean }, context: PluginContext): Promise<void> {
    this.context = context;
    this.isEnabled = config.enabled ?? false;
    
    console.log(`BasicPlugin initialized with enabled=${this.isEnabled}`);
    
    // Subscribe to grid events
    context.eventBus.on('grid.created' as any, (event: any) => {
      console.log(`BasicPlugin: Grid created with ID ${event.payload.gridId}`);
    });
  }

  async destroy(): Promise<void> {
    console.log('BasicPlugin destroyed');
    this.context = null;
  }

  update(config: Partial<{ enabled: boolean }>): void {
    if (config.enabled !== undefined) {
      this.isEnabled = config.enabled;
      console.log(`BasicPlugin updated with enabled=${this.isEnabled}`);
    }
  }
}

// Example 2: Plugin with Dependencies
class DependentPlugin implements Plugin<{}> {
  public readonly metadata = {
    id: 'dependent-plugin',
    name: 'Dependent Plugin',
    version: '1.0.0',
    dependencies: ['basic-plugin']
  };

  private context: PluginContext | null = null;

  async initialize(config: {}, context: PluginContext): Promise<void> {
    this.context = context;
    console.log('DependentPlugin initialized');
    
    // Emit a custom event
    context.eventBus.emit('plugin.dependent.loaded' as any, {
      pluginId: this.metadata.id
    });
  }

  async destroy(): Promise<void> {
    console.log('DependentPlugin destroyed');
    this.context = null;
  }
}

// Example 1: Basic Usage
function basicUsageExample() {
  console.log('=== Basic Plugin Usage Example ===');
  
  // Create plugin manager
  const pluginManager = new PluginManager();
  
  // Create plugins
  const basicPlugin = new BasicPlugin();
  const dependentPlugin = new DependentPlugin();
  
  // Register plugins
  pluginManager.register(basicPlugin);
  pluginManager.register(dependentPlugin);
  
  // Initialize plugins
  pluginManager.initializePlugin('basic-plugin', { enabled: true });
  pluginManager.initializePlugin('dependent-plugin');
  
  // Update plugin configuration
  pluginManager.updatePlugin('basic-plugin', { enabled: false });
  
  // Emit a grid event to see plugin response
  const pluginContext = pluginManager.getPluginContext('basic-plugin');
  if (pluginContext) {
    pluginContext.eventBus.emit('grid.created' as any, {
      gridId: 'example-grid'
    });
  }
  
  console.log('Basic usage example completed');
}

// Example 2: Plugin Management
function pluginManagementExample() {
  console.log('=== Plugin Management Example ===');
  
  const pluginManager = new PluginManager();
  
  // Register plugin
  const basicPlugin = new BasicPlugin();
  pluginManager.register(basicPlugin);
  
  // Check plugin status
  console.log(`Plugin registered: ${pluginManager.hasPlugin('basic-plugin')}`);
  console.log(`Plugin initialized: ${pluginManager.isPluginInitialized('basic-plugin')}`);
  console.log(`Registered plugins: ${pluginManager.getPluginIds().join(', ')}`);
  
  // Get plugin metadata
  const metadata = pluginManager.getPluginMetadata('basic-plugin');
  if (metadata) {
    console.log(`Plugin metadata: ${metadata.name} v${metadata.version}`);
  }
  
  console.log('Plugin management example completed');
}

// Example 3: Error Handling
function errorHandlingExample() {
  console.log('=== Error Handling Example ===');
  
  const pluginManager = new PluginManager();
  
  // Try to register the same plugin twice
  const basicPlugin = new BasicPlugin();
  pluginManager.register(basicPlugin);
  
  try {
    pluginManager.register(basicPlugin);
  } catch (error) {
    console.log(`Expected error: ${(error as Error).message}`);
  }
  
  // Try to initialize non-existent plugin
  pluginManager.initializePlugin('non-existent-plugin').catch((error) => {
    console.log(`Expected error: ${(error as Error).message}`);
  });
  
  console.log('Error handling example completed');
}

// Example 4: Cleanup
async function cleanupExample() {
  console.log('=== Cleanup Example ===');
  
  const pluginManager = new PluginManager();
  
  // Register and initialize plugins
  const basicPlugin = new BasicPlugin();
  const dependentPlugin = new DependentPlugin();
  
  pluginManager.register(basicPlugin);
  pluginManager.register(dependentPlugin);
  
  await pluginManager.initializePlugin('basic-plugin');
  await pluginManager.initializePlugin('dependent-plugin');
  
  // Destroy all plugins
  await pluginManager.destroyAll();
  
  console.log(`Plugins after cleanup: ${pluginManager.getPluginIds().join(', ')}`);
  
  console.log('Cleanup example completed');
}

// Run all examples
async function runAllExamples() {
  console.log('GridKit Plugin System Usage Examples');
  
  basicUsageExample();
  pluginManagementExample();
  errorHandlingExample();
  await cleanupExample();
  
  console.log('All examples completed!');
}

// Export for testing or further usage
export {
  BasicPlugin,
  DependentPlugin,
  basicUsageExample,
  pluginManagementExample,
  errorHandlingExample,
  cleanupExample,
  runAllExamples
};

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error);
}