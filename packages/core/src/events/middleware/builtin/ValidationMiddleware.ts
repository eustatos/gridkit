// ValidationMiddleware.ts

import { GridEvent, EventMiddleware } from '@/events/types';

interface ValidationRule {
  required?: boolean;
}

export function createValidationMiddleware(
  schema: Record<string, ValidationRule>
): EventMiddleware {
  return (event: GridEvent) => {
    // Простая проверка на наличие необходимых полей
    for (const key in schema) {
      if (schema[key].required && !(key in (event.payload as Record<string, unknown> || {}))) {
        console.error(`Validation failed: missing required field ${key}`);
        return null; // Отменить событие
      }
    }
    return event;
  };
}
