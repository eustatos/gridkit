# @nexus-state/async

Асинхронные утилиты для работы с состоянием Nexus

## Описание

Пакет `@nexus-state/async` предоставляет инструменты для работы с асинхронными операциями в контексте управления состоянием приложения.

## Установка

```bash
npm install @nexus-state/async
```

## Основные функции

- Управление асинхронными операциями
- Интеграция с основным ядром Nexus State
- Поддержка отмены операций

## Пример использования

```javascript
import { createAsyncOperation } from '@nexus-state/async';

const asyncOp = createAsyncOperation(async () => {
  // Ваш асинхронный код здесь
  return await fetchData();
});

// Использование в вашем приложении
```

## Лицензия

MIT