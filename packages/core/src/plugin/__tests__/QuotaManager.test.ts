import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuotaManager } from '../isolation/QuotaManager';

describe('QuotaManager', () => {
  let quotaManager: QuotaManager;

  beforeEach(() => {
    quotaManager = new QuotaManager();
  });

  describe('setQuota', () => {
    it('should set quotas for a plugin', () => {
      const quota = {
        maxEventsPerSecond: 100,
        maxHandlerTimePerSecond: 50,
        maxMemoryUsage: 1024,
      };

      quotaManager.setQuota('test-plugin', quota);

      // We can't directly access the quotas, but we can test the behavior
      // by checking if the plugin is within quota
      expect(
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 50)
      ).toBe(true);
    });
  });

  describe('checkQuota', () => {
    it('should return true if plugin is within quota', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 100 });
      expect(
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 50)
      ).toBe(true);
    });

    it('should return false if plugin exceeds quota', () => {
      // Mock console.warn to avoid output during tests
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 100 });
      expect(
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 150)
      ).toBe(false);

      // Restore console.warn
      warnSpy.mockRestore();
    });

    it('should return true if no quota is set for the plugin', () => {
      expect(
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1000)
      ).toBe(true);
    });

    it('should return true if no limit is set for the resource', () => {
      quotaManager.setQuota('test-plugin', {});
      expect(
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1000)
      ).toBe(true);
    });
  });

  describe('resetUsage', () => {
    it('should reset usage counters for a plugin', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 100 });
      quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 50);

      // Get usage before reset
      const usageBefore = quotaManager.getUsage('test-plugin');

      quotaManager.resetUsage('test-plugin');

      // Get usage after reset
      const usageAfter = quotaManager.getUsage('test-plugin');

      expect(usageAfter.eventsEmitted).toBe(0);
      expect(usageAfter.handlerExecutionTime).toBe(0);
      expect(usageAfter.memoryUsage).toBe(0);
    });
  });

  describe('getUsage', () => {
    it('should return current usage for a plugin', () => {
      const usage = quotaManager.getUsage('test-plugin');

      expect(usage).toEqual({
        eventsEmitted: 0,
        handlerExecutionTime: 0,
        memoryUsage: 0,
      });
    });
  });

  describe('suspendPlugin', () => {
    it('should log a warning when suspending a plugin', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      quotaManager.suspendPlugin('test-plugin');

      expect(warnSpy).toHaveBeenCalledWith(
        'Plugin test-plugin suspended due to quota violation'
      );

      // Restore console.warn
      warnSpy.mockRestore();
    });
  });

  describe('onQuotaExceeded', () => {
    it('should log a warning when quota is exceeded', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (quotaManager as any).onQuotaExceeded(
        'test-plugin',
        'maxEventsPerSecond',
        100
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'Plugin test-plugin exceeded quota for maxEventsPerSecond: 100'
      );

      // Restore console.warn
      warnSpy.mockRestore();
    });
  });
});
