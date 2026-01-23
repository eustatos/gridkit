# @nexus-state/react

Интеграция Nexus State с React

## Описание

Пакет `@nexus-state/react` предоставляет инструменты для интеграции Nexus State с React-приложениями.

## Установка

```bash
npm install @nexus-state/react
```

## Основные функции

- Хуки для работы с состоянием в React-компонентах
- Компоненты высшего порядка (HOC)
- Поддержка контекста React

## Пример использования

```javascript
import { useStore } from '@nexus-state/react';

function MyComponent() {
  const [state, setState] = useStore();

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => setState({ count: state.count + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

## Лицензия

MIT