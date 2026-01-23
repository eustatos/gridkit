# @nexus-state/family

Утилиты для работы с "семьями" состояний в Nexus State

## Описание

Пакет `@nexus-state/family` предоставляет инструменты для управления группами связанных состояний в приложении.

## Установка

```bash
npm install @nexus-state/family
```

## Основные функции

- Создание и управление "семьями" состояний
- Синхронизация связанных состояний
- Поддержка иерархической структуры

## Пример использования

```javascript
import { createFamily } from '@nexus-state/family';

const family = createFamily({
  user: {
    name: '',
    age: 0
  },
  settings: {
    theme: 'light'
  }
});

// Работа с состоянием
family.setState({
  user: {
    name: 'John',
    age: 30
  }
});
```

## Лицензия

MIT