import { describe, it, expect } from 'vitest';
import { createStore } from '../create-store';

describe('Store Performance', () => {
  it('should handle setState with 100 listeners under 5ms', () => {
    const store = createStore({ count: 0 });
    const listeners = Array.from({ length: 100 }, () => () => {});
    
    listeners.forEach(l => store.subscribe(l));
    
    const start = performance.now();
    store.setState({ count: 1 });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5);
  });
  
  it('should handle getState under 0.1ms', () => {
    const store = createStore({ count: 0 });
    
    const start = performance.now();
    store.getState();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(0.1);
  });
  
  it('should handle subscribe/unsubscribe under 0.5ms', () => {
    const store = createStore({ count: 0 });
    
    const start = performance.now();
    const unsubscribe = store.subscribe(() => {});
    unsubscribe();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(0.5);
  });
  
  it('should handle rapid updates efficiently', () => {
    const store = createStore({ count: 0 });
    
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      store.setState(prev => ({ count: prev.count + 1 }));
    }
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50); // < 50ms for 1000 updates
    expect(store.getState().count).toBe(1000);
  });
  
  it('should handle many listeners efficiently', () => {
    const store = createStore({ count: 0 });
    const listeners = Array.from({ length: 1000 }, () => () => {});
    
    listeners.forEach(l => store.subscribe(l));
    
    const start = performance.now();
    store.setState({ count: 1 });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10); // < 10ms for 1000 listeners
  });
});