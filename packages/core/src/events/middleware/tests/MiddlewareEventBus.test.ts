// MiddlewareEventBus.test.ts

import { MiddlewareEventBus } from '../MiddlewareEventBus';
import { GridEvent } from '../core/EventPipeline';

describe('MiddlewareEventBus', () => {
  let eventBus: MiddlewareEventBus;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    eventBus = new MiddlewareEventBus();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should process event through middleware pipeline', () => {
    const middleware = jest.fn((event: GridEvent) => event);
    eventBus.use(middleware);

    const event: GridEvent = { type: 'test' };
    eventBus.emit(event);

    expect(middleware).toHaveBeenCalledWith(event);
    expect(consoleSpy).toHaveBeenCalledWith('Event processed:', event);
  });

  test('should cancel event when middleware returns null', () => {
    const canceller = () => null;
    eventBus.use(canceller);

    const event: GridEvent = { type: 'test' };
    eventBus.emit(event);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test('should process modified event from middleware', () => {
    const modifier = (event: GridEvent) => ({
      ...event,
      payload: { modified: true },
    });
    eventBus.use(modifier);

    const event: GridEvent = { type: 'test', payload: { original: true } };
    eventBus.emit(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Event processed:',
      expect.objectContaining({ payload: { modified: true } })
    );
  });

  test('should handle multiple middleware in order', () => {
    const middleware1 = jest.fn((event: GridEvent) => {
      return { ...event, type: 'modified1' };
    });

    const middleware2 = jest.fn((event: GridEvent) => {
      return { ...event, type: 'modified2' };
    });

    eventBus.use(middleware1);
    eventBus.use(middleware2);

    const event: GridEvent = { type: 'test' };
    eventBus.emit(event);

    expect(middleware1).toHaveBeenCalledWith(event);
    expect(middleware2).toHaveBeenCalledWith({ ...event, type: 'modified1' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Event processed:',
      expect.objectContaining({ type: 'modified2' })
    );
  });

  test('should allow dynamic middleware removal', () => {
    const middleware1 = jest.fn((event: GridEvent) => event);
    const middleware2 = jest.fn((event: GridEvent) => event);

    const remove1 = eventBus.use(middleware1);
    eventBus.use(middleware2);

    const event: GridEvent = { type: 'test' };
    eventBus.emit(event);

    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();

    middleware1.mockClear();
    middleware2.mockClear();

    remove1(); // Remove middleware1
    eventBus.emit(event);

    expect(middleware1).not.toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
  });
});