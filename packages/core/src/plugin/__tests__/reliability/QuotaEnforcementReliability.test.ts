import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuotaManager, PluginQuota } from '../../isolation/QuotaManager';

describe('Quota Enforcement Reliability', () => {
  let quotaManager: QuotaManager;

  beforeEach(() => {
    quotaManager = new QuotaManager();
  });

  describe('quota enforcement', () => {
    it('should strictly enforce event emission quota', () => {
      const maxEvents = 10;
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: maxEvents });

      for (let i = 0; i < maxEvents; i++) {
        const result = quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1);
        expect(result).toBe(true);
      }

      const result = quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1);
      expect(result).toBe(false);
    });

    it('should enforce multiple quota types simultaneously', () => {
      const quotas: PluginQuota = {
        maxEventsPerSecond: 10,
        maxHandlerTimePerSecond: 100,
        maxMemoryUsage: 1024,
      };
      quotaManager.setQuota('test-plugin', quotas);

      for (let i = 0; i < 10; i++) {
        expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(true);
      }
      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(false);

      for (let i = 0; i < 100; i++) {
        expect(quotaManager.checkQuota('test-plugin', 'maxHandlerTimePerSecond', 1)).toBe(true);
      }
      expect(quotaManager.checkQuota('test-plugin', 'maxHandlerTimePerSecond', 1)).toBe(false);

      for (let i = 0; i < 1024; i++) {
        expect(quotaManager.checkQuota('test-plugin', 'maxMemoryUsage', 1)).toBe(true);
      }
      expect(quotaManager.checkQuota('test-plugin', 'maxMemoryUsage', 1)).toBe(false);
    });

    it('should enforce per-plugin quotas independently', () => {
      quotaManager.setQuota('plugin-a', { maxEventsPerSecond: 5 });
      quotaManager.setQuota('plugin-b', { maxEventsPerSecond: 5 });

      for (let i = 0; i < 5; i++) {
        expect(quotaManager.checkQuota('plugin-a', 'maxEventsPerSecond', 1)).toBe(true);
      }
      expect(quotaManager.checkQuota('plugin-a', 'maxEventsPerSecond', 1)).toBe(false);

      for (let i = 0; i < 5; i++) {
        expect(quotaManager.checkQuota('plugin-b', 'maxEventsPerSecond', 1)).toBe(true);
      }
      expect(quotaManager.checkQuota('plugin-b', 'maxEventsPerSecond', 1)).toBe(false);
    });
  });

  describe('quota reset behavior', () => {
    it('should reset usage counters after time period', () => {
      const maxEvents = 10;
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: maxEvents });

      for (let i = 0; i < maxEvents; i++) {
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1);
      }
      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(false);

      quotaManager.resetUsage('test-plugin');

      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(true);
    });

    it('should handle multiple resets correctly', () => {
      const maxEvents = 5;
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: maxEvents });

      for (let cycle = 0; cycle < 3; cycle++) {
        for (let i = 0; i < maxEvents; i++) {
          expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(true);
        }
        expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(false);

        quotaManager.resetUsage('test-plugin');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle quota of 0', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 0 });

      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(false);
    });

    it('should handle very large quotas', () => {
      const largeQuota = 1000000;
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: largeQuota });

      for (let i = 0; i < 10000; i++) {
        expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(true);
      }
    });

    it('should handle fractional quota amounts', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 10 });

      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 0.5)).toBe(true);
      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 0.5)).toBe(true);

      for (let i = 0; i < 19; i++) {
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 0.5);
      }
      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 0.5)).toBe(false);
    });
  });

  describe('resource cleanup', () => {
    it('should clean up plugin data when quota is cleared', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 10 });

      for (let i = 0; i < 5; i++) {
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1);
      }

      quotaManager.setQuota('test-plugin', {});

      expect(quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1)).toBe(true);
    });

    it('should handle plugin destruction gracefully', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 10 });

      for (let i = 0; i < 5; i++) {
        quotaManager.checkQuota('test-plugin', 'maxEventsPerSecond', 1);
      }

      const usage = quotaManager.getUsage('test-plugin');
      expect(usage.eventsEmitted).toBeGreaterThanOrEqual(0);
      expect(usage.eventsEmitted).toBeLessThanOrEqual(5);
    });
  });

  describe('error handling', () => {
    it('should handle undefined plugin gracefully', () => {
      expect(() => {
        quotaManager.checkQuota('non-existent-plugin', 'maxEventsPerSecond', 1);
      }).not.toThrow();
    });

    it('should handle undefined resources gracefully', () => {
      quotaManager.setQuota('test-plugin', { maxEventsPerSecond: 10 });

      expect(() => {
        quotaManager.checkQuota('test-plugin', 'undefined-resource', 1);
      }).not.toThrow();
    });
  });
});
