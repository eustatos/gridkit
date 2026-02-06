// ValidationMiddleware.ts

import { GridEvent, EventMiddleware } from '../core/EventPipeline';

export function createValidationMiddleware(
  schema: Record<string, any>
): EventMiddleware {
  return (event: GridEvent) => {
    // Простая проверка на наличие необходимых полей
    for (const key in schema) {
      if (schema[key].required && !(key in (event.payload || {}))) {
        console.error(`Validation failed: missing required field ${key}`);
        return null; // Отменить событие
      }
    }
    return event;
  };
}