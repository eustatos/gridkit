import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEventBus, EventPriority } from '../../core/PluginEventForwarder';
import { EventSandbox } from '../isolation/EventSandbox';
import { PluginEventForwarder } from '../../core/PluginEventForwarder';
import { CrossPluginBridge } from '../../core/CrossPluginBridge';

describe('Minimal Test', () => {
  it('should test EventSandbox forwarding', () => {
    const baseBus = createEventBus();
    const sandbox = new EventSandbox('test-plugin', baseBus, ['emit:test']);
    
    const baseHandler = vi.fn();
    baseBus.on('test', baseHandler);
    
    const localBus = sandbox.getBus();
    localBus.emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE });
    
    console.log('Base handler calls:', baseHandler.mock.calls.length);
    expect(baseHandler).toHaveBeenCalled();
  });

  it('should test CrossPluginBridge forwarding', () => {
    const baseBus = createEventBus();
    const forwarder = new PluginEventForwarder(baseBus);
    const bridge = new CrossPluginBridge(forwarder);
    
    forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
    forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);
    
    const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);
    
    const channelHandler = vi.fn();
    channelBus.on('channel:test:message', channelHandler);
    
    const pluginABus = forwarder.getSandbox('plugin-a');
    pluginABus?.emit('channel:test:message', { data: 'from-a' }, { priority: EventPriority.IMMEDIATE });
    
    console.log('Channel handler calls:', channelHandler.mock.calls.length);
    expect(channelHandler).toHaveBeenCalled();
  });
});
