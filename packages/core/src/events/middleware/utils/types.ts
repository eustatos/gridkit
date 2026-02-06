// types.ts

import { GridEvent } from '../core/EventPipeline';

export type MiddlewareResult<T extends GridEvent = GridEvent> =
  | T
  | null
  | Promise<T | null>;

export interface EventContext<T extends GridEvent = GridEvent> {
  event: T;
  cancel: () => void;
  isCancelled: () => boolean;
}