# @nexus-state/immer

Интеграция Immer с Nexus State

## Описание

Пакет `@nexus-state/immer` предоставляет интеграцию библиотеки Immer с Nexus State для упрощения работы с неизменяемыми структурами данных.

## Установка

```bash
npm install @nexus-state/immer
```

## Основные функции

- Интеграция Immer с хранилищем Nexus State
- Упрощенная работа с неизменяемыми структурами
- Поддержка черновиков (drafts) для изменения состояния

## Пример использования

```javascript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({
  users: []
});

// Использование черновика для изменения состояния
store.setState((draft) => {
  draft.users.push({ id: 1, name: 'John' });
});
```

## Лицензия

MIT