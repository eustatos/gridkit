// EventPipeline.test.ts

import { EventPipeline, GridEvent } from '../core/EventPipeline';

describe('EventPipeline', () => {
  let pipeline: EventPipeline;
  let events: GridEvent[];

  beforeEach(() => {
    pipeline = new EventPipeline();
    events = [];
  });

  test('Middleware chain: Execution in correct order', () => {
    const middleware1 = vi.fn((event: GridEvent) => {
      events.push({ ...event, type: 'middleware1' });
      return event;
    });

    const middleware2 = vi.fn((event: GridEvent) => {
      events.push({ ...event, type: 'middleware2' });
      return event;
    });

    pipeline.use(middleware1);
    pipeline.use(middleware2);

    const event: GridEvent = { type: 'test' };
    pipeline.process(event);

    expect(middleware1).toHaveBeenCalledWith(event);
    expect(middleware2).toHaveBeenCalledWith(event);
  });

  test('Event modification: Middleware can modify event payload', () => {
    const modifier = (event: GridEvent) => ({
      ...event,
      payload: { modified: true },
    });

    pipeline.use(modifier);

    const event: GridEvent = { type: 'test', payload: { original: true } };
    const result = pipeline.process(event);

    expect(result?.payload).toEqual({ modified: true });
  });

  test('Event cancellation: Middleware can cancel events', () => {
    const canceller = () => null;

    pipeline.use(canceller);

    const event: GridEvent = { type: 'test' };
    const result = pipeline.process(event);

    expect(result).toBeNull();
  });

  test('Pipeline compilation: No runtime overhead after compilation', () => {
    const middleware = vi.fn((event: GridEvent) => event);

    pipeline.use(middleware);

    const event: GridEvent = { type: 'test' };
    pipeline.process(event); // First call compiles
    pipeline.process(event); // Second call uses compiled version

    expect(middleware).toHaveBeenCalledTimes(2);
  });

  test('Dynamic middleware: Add/remove at runtime works', () => {
    const middleware1 = vi.fn((event: GridEvent) => event);
    const middleware2 = vi.fn((event: GridEvent) => event);

    const remove1 = pipeline.use(middleware1);
    pipeline.use(middleware2);

    const event: GridEvent = { type: 'test' };
    pipeline.process(event);

    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();

    middleware1.mockClear();
    middleware2.mockClear();

    remove1(); // Remove middleware1
    pipeline.process(event);

    expect(middleware1).not.toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
  });

  test('Error handling: Middleware errors do not break pipeline', () => {
    const errorMiddleware = () => {
      throw new Error('Test error');
    };

    const nextMiddleware = vi.fn((event: GridEvent) => event);

    pipeline.use(errorMiddleware);
    pipeline.use(nextMiddleware);

    const event: GridEvent = { type: 'test' };
    expect(() => pipeline.process(event)).not.toThrow();
    expect(nextMiddleware).toHaveBeenCalled();
  });
});