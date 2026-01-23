# @nexus-state/middleware

Middleware для Nexus State

## Описание

Пакет `@nexus-state/middleware` предоставляет инструменты для создания и использования middleware в Nexus State.

## Установка

```bash
npm install @nexus-state/middleware
```

## Основные функции

- Создание middleware для перехвата и модификации действий
- Поддержка асинхронных middleware
- Интеграция с основным ядром Nexus State

## Пример использования

```javascript
import { createMiddleware } from '@nexus-state/middleware';

const loggerMiddleware = createMiddleware((action, next) => {
  console.log('Action:', action);
  return next(action);
});

// Подключение к хранилищу
store.use(loggerMiddleware);
```

## Лицензия

MIT