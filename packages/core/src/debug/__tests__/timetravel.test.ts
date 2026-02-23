/**
 * Tests for TimeTravelManager.
 * 
 * @module @gridkit/core/debug/__tests__/timetravel
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimeTravelManager } from '../timetravel/TimeTravelManager';

describe('TimeTravelManager', () => {
  let manager: TimeTravelManager;

  beforeEach(() => {
    manager = new TimeTravelManager(10);
  });

  it('should create snapshots', () => {
    const snapshot = manager.createSnapshot({
      data: [{ id: '1' }],
      columnOrder: ['col1'],
      columnVisibility: { col1: true },
      rowSelection: {},
      expanded: {},
    }, 0);

    expect(snapshot).toBeDefined();
    expect(snapshot.timestamp).toBeGreaterThan(0);
    expect(snapshot.eventIndex).toBe(0);
    expect(snapshot.metadata.rowCount).toBe(1);
  });

  it('should get snapshot by timestamp', () => {
    const snapshot1 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    const snapshot2 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);

    expect(manager.getSnapshot(snapshot1.timestamp)).toBe(snapshot1);
    expect(manager.getSnapshot(snapshot2.timestamp)).toBe(snapshot2);
  });

  it('should list all snapshots', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 2);

    const snapshots = manager.listSnapshots();
    expect(snapshots).toHaveLength(3);
  });

  it('should travel to specific timestamp', () => {
    const snapshot1 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    const snapshot2 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);

    const result = manager.travelTo(snapshot2.timestamp);
    expect(result).toBe(snapshot2);
  });

  it('should travel back', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 2);

    // travelBack from latest should return the previous snapshot
    const result = manager.travelBack(1);
    expect(result).toBeDefined();
    expect(result?.timestamp).toBeGreaterThan(0);
  });

  it('should travel forward', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 2);

    manager.travelTo(1);
    const result = manager.travelForward(1);
    expect(result).toBeDefined();
    expect(result?.timestamp).toBe(2);
  });

  it('should handle circular buffer capacity', () => {
    const smallManager = new TimeTravelManager(3);
    
    smallManager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    smallManager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);
    smallManager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 2);
    smallManager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 3);

    // Should only keep last 3
    expect(smallManager.listSnapshots()).toHaveLength(3);
  });

  it('should replay snapshots', () => {
    const snapshot1 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    const snapshot2 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);

    // This would be used for time-travel UI
    manager.replay(snapshot1.timestamp, snapshot2.timestamp, 1);
    expect(manager['isPlaying']).toBe(true);

    manager.stop();
    expect(manager['isPlaying']).toBe(false);
  });

  it('should pause and resume replay', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.replay(1, 2, 1);
    
    manager.pause();
    expect(manager['isPlaying']).toBe(false);

    manager.resume();
    expect(manager['isPlaying']).toBe(true);

    manager.stop();
  });

  it('should get current snapshot', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);

    const current = manager.getCurrentSnapshot();
    expect(current).toBeDefined();
    expect(current?.timestamp).toBeGreaterThan(0);
  });

  it('should get debug info', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);

    const info = manager.getDebugInfo();
    expect(info.snapshotCount).toBe(2);
    expect(info.capacity).toBe(10);
    expect(info.usage).toBe(20);
  });

  it('should store and retrieve events', () => {
    manager.storeEvent(
      { type: 'test', payload: {}, timestamp: Date.now() },
      1
    );

    const event = manager.getEvent(1);
    expect(event).toBeDefined();
    expect(event?.type).toBe('test');
  });

  it('should clear all data', () => {
    manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
    manager.storeEvent({ type: 'test', payload: {}, timestamp: Date.now() }, 1);

    manager.clear();

    expect(manager.listSnapshots()).toHaveLength(0);
    expect(manager.getEvent(1)).toBeUndefined();
    expect(manager.getCurrentIndex()).toBe(-1);
  });
});
