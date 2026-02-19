import { describe, it, expect } from 'vitest';
import { createEventBus, EventPriority } from '../../events';
import { PluginEventForwarder } from '../core/PluginEventForwarder';

describe('Debug Test', () => {
  it('should debug plugin bus', () => {
    const baseBus = createEventBus();
    const forwarder = new PluginEventForwarder(baseBus);
    
    const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:channel:test:message']);
    const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:channel:test:message']);
    
    console.log('plugin1Bus:', plugin1Bus);
    console.log('plugin2Bus:', plugin2Bus);
    console.log('Are they the same?', plugin1Bus === plugin2Bus);
    
    // Get the sandbox instances
    const sandbox1 = forwarder.getSandboxInstance('plugin-1');
    const sandbox2 = forwarder.getSandboxInstance('plugin-2');
    
    console.log('sandbox1.getBus():', sandbox1?.getBus());
    console.log('sandbox2.getBus():', sandbox2?.getBus());
    
    console.log('plugin1Bus === sandbox1.getBus():', plugin1Bus === sandbox1?.getBus());
    console.log('plugin2Bus === sandbox2.getBus():', plugin2Bus === sandbox2?.getBus());
  });
});
