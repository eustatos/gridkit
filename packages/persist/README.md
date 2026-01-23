# @nexus-state/persist

Персистентность для Nexus State

## Описание

Пакет `@nexus-state/persist` предоставляет инструменты для сохранения состояния приложения между сессиями.

## Установка

```bash
npm install @nexus-state/persist
```

## Основные функции

- Сохранение состояния в localStorage/sessionStorage
- Поддержка различных стратегий сохранения
- Возможность выборочного сохранения частей состояния

## Пример использования

```javascript
import { createPersist } from '@nexus-state/persist';

const persist = createPersist({
  key: 'my-app-state',
  storage: localStorage
});

// Подключение к хранилищу
store.use(persist);
```

## Лицензия

MIT