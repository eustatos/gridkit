import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceMonitor } from '../security/ResourceMonitor';

describe('ResourceMonitor', () => {
  let resourceMonitor: ResourceMonitor;

  beforeEach(() => {
    resourceMonitor = new ResourceMonitor();
  });

  describe('startMonitoring', () => {
    it('should start monitoring resource usage', () => {
      const intervalSpy = vi.spyOn(globalThis, 'setInterval');
      
      resourceMonitor.startMonitoring(100);
      
      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      
      // Clean up
      resourceMonitor.stopMonitoring();
      intervalSpy.mockRestore();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring resource usage', () => {
      const intervalSpy = vi.spyOn(globalThis, 'setInterval');
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      
      resourceMonitor.startMonitoring(100);
      resourceMonitor.stopMonitoring();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      // Clean up
      intervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('recordEventEmission', () => {
    it('should record event emission for a plugin', () => {
      resourceMonitor.recordEventEmission('test-plugin', 100);
      
      const usage = resourceMonitor.getUsage('test-plugin');
      expect(usage.eventsEmitted).toBe(1);
      expect(usage.eventBytesEmitted).toBe(100);
    });
  });

  describe('recordHandlerExecution', () => {
    it('should record handler execution time for a plugin', () => {
      resourceMonitor.recordHandlerExecution('test-plugin', 50);
      
      const usage = resourceMonitor.getUsage('test-plugin');
      expect(usage.handlerExecutionTime).toBe(50);
      expect(usage.handlerExecutions).toBe(1);
    });
  });

  describe('getUsage', () => {
    it('should return current resource usage for a plugin', () => {
      const usage = resourceMonitor.getUsage('test-plugin');
      
      expect(usage).toEqual({
        eventsEmitted: 0,
        eventBytesEmitted: 0,
        handlerExecutionTime: 0,
        handlerExecutions: 0,
        startTime: expect.any(Number),
      });
    });
  });

  describe('isExceedingLimits', () => {
    it('should return false for plugins within limits', () => {
      const result = resourceMonitor.isExceedingLimits('test-plugin');
      expect(result).toBe(false);
    });

    it('should return true for plugins exceeding event emission limits', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Manually set high event count
      const usage = (resourceMonitor as any).getOrCreateUsage('test-plugin');
      usage.eventsEmitted = 1500; // Exceeds 1000 limit
      
      const result = resourceMonitor.isExceedingLimits('test-plugin');
      expect(result).toBe(true);
      
      // Restore console.warn
      warnSpy.mockRestore();
    });

    it('should return true for plugins exceeding handler execution limits', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Manually set high execution time
      const usage = (resourceMonitor as any).getOrCreateUsage('test-plugin');
      usage.handlerExecutionTime = 600; // Exceeds 500 limit
      
      const result = resourceMonitor.isExceedingLimits('test-plugin');
      expect(result).toBe(true);
      
      // Restore console.warn
      warnSpy.mockRestore();
    });
  });

  describe('getOrCreateUsage', () => {
    it('should create usage tracking for a new plugin', () => {
      const usage = (resourceMonitor as any).getOrCreateUsage('test-plugin');
      
      expect(usage).toEqual({
        eventsEmitted: 0,
        eventBytesEmitted: 0,
        handlerExecutionTime: 0,
        handlerExecutions: 0,
        startTime: expect.any(Number),
      });
    });

    it('should return existing usage tracking for a plugin', () => {
      const usage1 = (resourceMonitor as any).getOrCreateUsage('test-plugin');
      const usage2 = (resourceMonitor as any).getOrCreateUsage('test-plugin');
      
      expect(usage1).toBe(usage2);
    });
  });
});